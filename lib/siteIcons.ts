import { sql } from "drizzle-orm";
import { db } from "@/db/client";

// Ícone (favicon) configurado em cada site. Descobrimos lendo o HTML do site, guardamos a URL e o painel
// usa essa imagem. Guardar evita refazer a busca a cada visita e funciona logo que o site é cadastrado.

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS site_icons (
    site_id uuid PRIMARY KEY REFERENCES sites(id) ON DELETE CASCADE,
    url text,
    checked_at timestamptz NOT NULL DEFAULT now()
  )`);
  ensured = true;
}

type Row = Record<string, unknown>;
const rows = (r: unknown) => r as Row[];

export const hostKey = (url: string) => url.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "").toLowerCase();

const UA = "Mozilla/5.0 (compatible; MetricasBot/1.0)";

async function fetchText(url: string, ms = 8000) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    return res.ok ? { text: (await res.text()).slice(0, 800_000), finalUrl: res.url } : null;
  } catch {
    return null;
  }
}

async function isImage(url: string) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    const type = res.headers.get("content-type") ?? "";
    await res.body?.cancel();
    return res.ok && (type.startsWith("image/") || /\.(ico|png|svg|jpe?g|webp)(\?|$)/i.test(url));
  } catch {
    return false;
  }
}

const attr = (tag: string, name: string) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[1] ?? m[2] ?? m[3] ?? null) : null;
};

/** Procura o ícone declarado na página (link rel=icon); sem ele, tenta /favicon.ico. */
export async function resolveIcon(siteUrl: string): Promise<string | null> {
  const base = /^https?:\/\//.test(siteUrl) ? siteUrl : `https://${siteUrl}`;
  const page = await fetchText(base);
  const candidates: { href: string; score: number }[] = [];
  if (page) {
    for (const tag of page.text.match(/<link\b[^>]*>/gi) ?? []) {
      const rel = (attr(tag, "rel") ?? "").toLowerCase();
      const href = attr(tag, "href");
      if (!href || !/(^|\s)(shortcut\s+)?icon($|\s)|apple-touch-icon/.test(rel)) continue;
      const media = (attr(tag, "media") ?? "").toLowerCase();
      const size = parseInt((attr(tag, "sizes") ?? "").split("x")[0], 10) || 0;
      // Prefere o ícone do tema claro, de tamanho médio (32–192 px); ícones só para modo escuro ficam por último.
      let score = media.includes("dark") ? 0 : 10;
      score += size >= 32 && size <= 192 ? 5 : 0;
      score += rel.includes("apple") ? 0 : 2;
      try {
        candidates.push({ href: new URL(href, page.finalUrl).toString(), score });
      } catch {
        /* href inválido */
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  for (const c of candidates.slice(0, 3)) if (await isImage(c.href)) return c.href;
  try {
    const fav = new URL("/favicon.ico", page?.finalUrl ?? base).toString();
    if (await isImage(fav)) return fav;
  } catch {
    /* ignora */
  }
  return null;
}

export async function refreshSiteIcon(siteId: string, siteUrl: string) {
  await ensureTable();
  const url = await resolveIcon(siteUrl);
  await db.execute(sql`INSERT INTO site_icons (site_id, url, checked_at) VALUES (${siteId}, ${url}, now())
    ON CONFLICT (site_id) DO UPDATE SET url = EXCLUDED.url, checked_at = now()`);
  return url;
}

/** Mapa domínio → URL do ícone, para o painel inteiro. */
export async function getIconMap(): Promise<Record<string, string>> {
  await ensureTable();
  const res = rows(await db.execute(sql`SELECT s.url AS site_url, i.url AS icon FROM site_icons i JOIN sites s ON s.id = i.site_id WHERE i.url IS NOT NULL`));
  const map: Record<string, string> = {};
  for (const r of res) map[hostKey(String(r.site_url))] = String(r.icon);
  return map;
}

/** Descobre o ícone dos sites que ainda não têm (ou cuja última busca falhou há mais de 3 dias). */
export async function refreshMissingIcons() {
  await ensureTable();
  const todo = rows(
    await db.execute(sql`SELECT s.id::text AS id, s.url FROM sites s LEFT JOIN site_icons i ON i.site_id = s.id
      WHERE i.site_id IS NULL OR (i.url IS NULL AND i.checked_at < now() - interval '3 days')`)
  );
  let found = 0;
  for (const t of todo) if (await refreshSiteIcon(String(t.id), String(t.url))) found++;
  return { checked: todo.length, found };
}
