import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { askGemini } from "@/lib/gemini";
import { askGeminiGrounded } from "@/lib/geminiGrounded";

// Visibilidade em IA (GEO): perguntamos ao Gemini, como uma pessoa faria, prompts cadastrados
// por site e registramos se a marca foi mencionada e se o domínio apareceu entre as fontes.
// Só o Gemini é consultado; outros mecanismos não entram até existir integração real.

export const ENGINE = "gemini";

let ensured = false;
export async function ensureGeoTables() {
  if (ensured) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS geo_settings (
    site_id uuid PRIMARY KEY REFERENCES sites(id) ON DELETE CASCADE,
    brand text NOT NULL,
    description text NOT NULL DEFAULT '',
    competitors jsonb NOT NULL DEFAULT '[]'::jsonb
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS geo_prompts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    prompt text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS geo_runs (
    id bigserial PRIMARY KEY,
    run_id uuid NOT NULL,
    site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    prompt_id uuid,
    prompt text NOT NULL,
    engine text NOT NULL,
    ran_at timestamptz NOT NULL DEFAULT now(),
    mentioned boolean NOT NULL,
    cited boolean,
    competitors jsonb NOT NULL DEFAULT '[]'::jsonb,
    answer text NOT NULL,
    sources jsonb NOT NULL DEFAULT '[]'::jsonb,
    grounded boolean NOT NULL DEFAULT false
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS geo_runs_site_at ON geo_runs (site_id, ran_at)`);
  ensured = true;
}

type Row = Record<string, unknown>;
const rows = (r: unknown) => r as Row[];

export interface GeoSettings {
  brand: string;
  description: string;
  competitors: string[];
}
export interface GeoPrompt {
  id: string;
  prompt: string;
}
export interface GeoResult {
  runId: string;
  ranAt: Date;
  promptId: string | null;
  prompt: string;
  mentioned: boolean;
  cited: boolean | null; // null = sem busca ligada, não dá para verificar
  competitors: string[];
  answer: string;
  sources: { uri: string; title: string }[];
}
export interface GeoBatch {
  runId: string;
  ranAt: Date;
  total: number;
  mentioned: number;
  cited: number;
  verifiable: number;
  results: GeoResult[];
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const hostOf = (url: string) => url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();

/** A marca aparece no texto como palavra inteira, ignorando acento e caixa. */
export function mentions(text: string, name: string) {
  const n = norm(name.trim());
  if (n.length < 2) return false;
  const esc = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${esc}([^a-z0-9]|$)`).test(norm(text));
}

export async function getGeo(siteId: string, siteName: string) {
  await ensureGeoTables();
  const [s, p, r] = await Promise.all([
    db.execute(sql`SELECT brand, description, competitors FROM geo_settings WHERE site_id = ${siteId}`),
    db.execute(sql`SELECT id::text AS id, prompt FROM geo_prompts WHERE site_id = ${siteId} ORDER BY created_at`),
    db.execute(sql`SELECT run_id::text AS run_id, ran_at, prompt_id::text AS prompt_id, prompt, mentioned, cited, competitors, answer, sources
      FROM geo_runs WHERE site_id = ${siteId} AND ran_at > now() - interval '400 days' ORDER BY ran_at DESC LIMIT 2000`),
  ]);
  const st = rows(s)[0];
  const settings: GeoSettings | null = st
    ? { brand: String(st.brand), description: String(st.description ?? ""), competitors: (st.competitors as string[]) ?? [] }
    : null;
  const prompts: GeoPrompt[] = rows(p).map((x) => ({ id: String(x.id), prompt: String(x.prompt) }));

  const byRun = new Map<string, GeoBatch>();
  for (const x of rows(r)) {
    const id = String(x.run_id);
    const res: GeoResult = {
      runId: id,
      ranAt: new Date(String(x.ran_at)),
      promptId: x.prompt_id ? String(x.prompt_id) : null,
      prompt: String(x.prompt),
      mentioned: Boolean(x.mentioned),
      cited: x.cited === null ? null : Boolean(x.cited),
      competitors: (x.competitors as string[]) ?? [],
      answer: String(x.answer),
      sources: (x.sources as { uri: string; title: string }[]) ?? [],
    };
    const b = byRun.get(id) ?? { runId: id, ranAt: res.ranAt, total: 0, mentioned: 0, cited: 0, verifiable: 0, results: [] };
    b.total++;
    if (res.mentioned) b.mentioned++;
    if (res.cited !== null) b.verifiable++;
    if (res.cited) b.cited++;
    b.results.push(res);
    byRun.set(id, b);
  }
  const batches = [...byRun.values()].sort((a, b) => b.ranAt.getTime() - a.ranAt.getTime()); // mais recente primeiro
  return { settings: settings ?? { brand: siteName, description: "", competitors: [] }, configured: !!settings, prompts, batches };
}

export async function saveSettings(siteId: string, s: GeoSettings) {
  await ensureGeoTables();
  const competitors = s.competitors.map((c) => c.trim()).filter(Boolean).slice(0, 5);
  await db.execute(sql`INSERT INTO geo_settings (site_id, brand, description, competitors)
    VALUES (${siteId}, ${s.brand.trim()}, ${s.description.trim()}, ${JSON.stringify(competitors)}::jsonb)
    ON CONFLICT (site_id) DO UPDATE SET brand = EXCLUDED.brand, description = EXCLUDED.description, competitors = EXCLUDED.competitors`);
}

export async function addPrompts(siteId: string, list: string[]) {
  await ensureGeoTables();
  const existing = new Set(rows(await db.execute(sql`SELECT prompt FROM geo_prompts WHERE site_id = ${siteId}`)).map((r) => norm(String(r.prompt))));
  let n = existing.size;
  for (const raw of list) {
    const prompt = raw.trim().slice(0, 300);
    if (prompt.length < 5 || existing.has(norm(prompt)) || n >= 20) continue;
    await db.execute(sql`INSERT INTO geo_prompts (site_id, prompt) VALUES (${siteId}, ${prompt})`);
    existing.add(norm(prompt));
    n++;
  }
}

export async function removePrompt(siteId: string, id: string) {
  await ensureGeoTables();
  await db.execute(sql`DELETE FROM geo_prompts WHERE site_id = ${siteId} AND id = ${id}::uuid`);
}

/** O Gemini sugere perguntas que um cliente real faria; o usuário revisa. São ponto de partida, não resultado. */
export async function suggestPrompts(brand: string, domain: string, description: string): Promise<string[]> {
  const text = await askGemini(
    "Você ajuda a montar prompts para medir a presença de uma marca em respostas de IA. Responda SOMENTE com um array JSON de strings.",
    `Marca: ${brand}\nSite: ${domain}\nO que oferece: ${description || "(não informado; deduza só do nome e do domínio, sem inventar detalhes)"}\n\nCrie 8 perguntas em português que um possível cliente faria a um assistente de IA ao procurar esse tipo de serviço ou produto, SEM citar o nome da marca (ex.: "qual a melhor agência de X em São Paulo?"). Misture perguntas de pesquisa, comparação e recomendação.`
  );
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error("O Gemini não devolveu uma lista de prompts.");
  const arr = JSON.parse(m[0]);
  return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
}

/** Roda todos os prompts do site (4 em paralelo) e grava uma verificação. */
export async function runGeoCheck(siteId: string, siteUrl: string) {
  await ensureGeoTables();
  const [s] = rows(await db.execute(sql`SELECT brand, competitors FROM geo_settings WHERE site_id = ${siteId}`));
  if (!s) throw new Error("Configure a marca antes de verificar.");
  const brand = String(s.brand);
  const competitors = (s.competitors as string[]) ?? [];
  const prompts = rows(await db.execute(sql`SELECT id::text AS id, prompt FROM geo_prompts WHERE site_id = ${siteId} ORDER BY created_at`));
  if (!prompts.length) throw new Error("Cadastre ao menos um prompt.");
  const domain = hostOf(siteUrl);
  const runId = randomUUID();
  let ok = 0;
  let lastError = "";

  for (let i = 0; i < prompts.length; i += 4) {
    await Promise.all(
      prompts.slice(i, i + 4).map(async (p) => {
        try {
          const a = await askGeminiGrounded(String(p.prompt));
          const mentioned = mentions(a.text, brand) || a.text.toLowerCase().includes(domain);
          const cited = a.grounded
            ? a.sources.some((x) => norm(x.title).includes(domain) || hostOf(x.uri) === domain)
            : null;
          const comp = competitors.filter((c) => mentions(a.text, c));
          await db.execute(sql`INSERT INTO geo_runs (run_id, site_id, prompt_id, prompt, engine, mentioned, cited, competitors, answer, sources, grounded)
            VALUES (${runId}::uuid, ${siteId}, ${String(p.id)}::uuid, ${String(p.prompt)}, ${ENGINE}, ${mentioned}, ${cited}, ${JSON.stringify(comp)}::jsonb,
                    ${a.text.slice(0, 6000)}, ${JSON.stringify(a.sources.slice(0, 12))}::jsonb, ${a.grounded})`);
          ok++;
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e);
        }
      })
    );
  }
  if (!ok) throw new Error(lastError || "Nenhuma consulta funcionou.");
  return { runId, done: ok, failed: prompts.length - ok };
}
