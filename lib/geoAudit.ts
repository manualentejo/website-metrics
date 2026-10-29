import { sql } from "drizzle-orm";
import { db } from "@/db/client";

// Auditoria GEO técnica: verifica, só lendo o site (HTML, robots.txt, sitemap, llms.txt), se ele está
// pronto para ser entendido e citado por buscadores com IA. Não usa IA e não gasta crédito nenhum.
// Não confundir com AI Visibility (se as IAs de fato citam a marca): isto mede preparo, não resultado.

export type CheckStatus = "ok" | "warn" | "fail";
export interface GeoCheck {
  id: string;
  title: string;
  status: CheckStatus;
  weight: number;
  /** O que foi encontrado, em linguagem simples. */
  found: string;
  /** Por que isso importa para as IAs. */
  why: string;
  /** Como corrigir (pensado para quem usa Framer). */
  fix: string;
}
export interface GeoAudit {
  ranAt: Date;
  score: number;
  checks: GeoCheck[];
}

let ensured = false;
export async function ensureGeoAuditTable() {
  if (ensured) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS geo_audits (
    id bigserial PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    ran_at timestamptz NOT NULL DEFAULT now(),
    score int NOT NULL,
    checks jsonb NOT NULL
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS geo_audits_site_at ON geo_audits (site_id, ran_at)`);
  ensured = true;
}

const UA = "Mozilla/5.0 (compatible; MetricasBot/1.0; +auditoria de GEO)";

async function get(url: string, ms = 10000): Promise<{ ok: boolean; status: number; text: string; finalUrl: string }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,text/plain,*/*" }, redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    const text = res.ok ? (await res.text()).slice(0, 1_500_000) : "";
    return { ok: res.ok, status: res.status, text, finalUrl: res.url };
  } catch {
    return { ok: false, status: 0, text: "", finalUrl: url };
  }
}

const AI_BOTS = [
  { agent: "GPTBot", label: "ChatGPT (OpenAI)" },
  { agent: "ChatGPT-User", label: "ChatGPT (navegação)" },
  { agent: "ClaudeBot", label: "Claude (Anthropic)" },
  { agent: "PerplexityBot", label: "Perplexity" },
  { agent: "Google-Extended", label: "Gemini (Google)" },
  { agent: "CCBot", label: "Common Crawl" },
];

/** Quais robôs de IA o robots.txt bloqueia por completo. */
function blockedBots(robots: string): string[] {
  const groups: { agents: string[]; disallowAll: boolean; allowAll: boolean }[] = [];
  let cur: { agents: string[]; disallowAll: boolean; allowAll: boolean } | null = null;
  let lastWasAgent = false;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) continue;
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === "user-agent") {
      if (!cur || !lastWasAgent) {
        cur = { agents: [], disallowAll: false, allowAll: false };
        groups.push(cur);
      }
      cur.agents.push(val.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (cur && key === "disallow" && val === "/") cur.disallowAll = true;
      if (cur && key === "allow" && val === "/") cur.allowAll = true;
    }
  }
  const blocks = (agent: string) => {
    const specific = groups.find((g) => g.agents.includes(agent.toLowerCase()));
    const g = specific ?? groups.find((g) => g.agents.includes("*"));
    return !!g && g.disallowAll && !g.allowAll;
  };
  return AI_BOTS.filter((b) => blocks(b.agent)).map((b) => b.label);
}

const strip = (s: string) => s.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const attr = (tag: string, name: string) => tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"))?.[2] ?? tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i"))?.[3] ?? null;

function meta(html: string, key: string, by: "name" | "property" = "name"): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if ((attr(tag, by) ?? "").toLowerCase() === key) return attr(tag, "content");
  }
  return null;
}

function jsonLdTypes(html: string): string[] {
  const types: string[] = [];
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === "object") {
      const o = n as Record<string, unknown>;
      const t = o["@type"];
      if (typeof t === "string") types.push(t);
      else if (Array.isArray(t)) types.push(...t.filter((x): x is string => typeof x === "string"));
      if (o["@graph"]) walk(o["@graph"]);
    }
  };
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(m[1]));
    } catch {
      /* JSON-LD inválido: conta como ausente */
    }
  }
  return types;
}

export async function auditSite(siteUrl: string): Promise<{ score: number; checks: GeoCheck[] }> {
  const base = new URL(/^https?:\/\//.test(siteUrl) ? siteUrl : `https://${siteUrl}`);
  const origin = base.origin;
  const [page, robots, llms, sitemap] = await Promise.all([get(base.toString()), get(`${origin}/robots.txt`), get(`${origin}/llms.txt`), get(`${origin}/sitemap.xml`)]);

  const checks: GeoCheck[] = [];
  const add = (c: GeoCheck) => checks.push(c);

  if (!page.ok) {
    return {
      score: 0,
      checks: [
        {
          id: "reachable",
          title: "Site acessível para robôs",
          status: "fail",
          weight: 1,
          found: `Não conseguimos abrir o site (resposta ${page.status || "sem resposta"}).`,
          why: "Se o robô não consegue abrir a página, nenhuma IA consegue ler o seu conteúdo.",
          fix: "Confirme se o site está publicado e abre sem login ou bloqueio. Depois rode a auditoria de novo.",
        },
      ],
    };
  }
  const html = page.text;

  // 1. HTTPS
  const https = page.finalUrl.startsWith("https://");
  add({
    id: "https",
    title: "Site seguro (HTTPS)",
    status: https ? "ok" : "fail",
    weight: 4,
    found: https ? "O site usa HTTPS." : "O site abre sem HTTPS.",
    why: "Buscadores e IAs preferem fontes seguras e podem ignorar as que não são.",
    fix: "No Framer, o HTTPS é automático em domínios conectados. Verifique a configuração do domínio.",
  });

  // 2. robots.txt e robôs de IA
  if (!robots.ok) {
    add({
      id: "robots",
      title: "Robôs de IA podem ler o site (robots.txt)",
      status: "warn",
      weight: 20,
      found: "Não há arquivo robots.txt. Sem ele, nada bloqueia os robôs, mas você também não declara regras.",
      why: "O robots.txt diz aos robôs o que eles podem ler. Bloquear os robôs de IA tira o seu site das respostas deles.",
      fix: "No Framer: Configurações do site › General › Robots.txt. Não bloqueie GPTBot, ClaudeBot, PerplexityBot nem Google-Extended.",
    });
  } else {
    const blocked = blockedBots(robots.text);
    add({
      id: "robots",
      title: "Robôs de IA podem ler o site (robots.txt)",
      status: blocked.length === 0 ? "ok" : blocked.length >= 3 ? "fail" : "warn",
      weight: 20,
      found: blocked.length === 0 ? "Nenhum robô de IA está bloqueado." : `Bloqueados: ${blocked.join(", ")}.`,
      why: "Robôs bloqueados não leem o seu site, então as IAs correspondentes não conseguem citar você.",
      fix: "No Framer: Configurações do site › General › Robots.txt. Remova as linhas “Disallow: /” dos robôs de IA que você quer que leiam o site.",
    });
  }

  // 3. sitemap
  const sitemapInRobots = /^\s*sitemap\s*:/im.test(robots.text);
  const hasSitemap = (sitemap.ok && /<urlset|<sitemapindex/i.test(sitemap.text)) || sitemapInRobots;
  add({
    id: "sitemap",
    title: "Mapa do site (sitemap.xml)",
    status: hasSitemap ? "ok" : "fail",
    weight: 10,
    found: hasSitemap ? "O mapa do site existe." : "Não encontramos o sitemap.xml.",
    why: "É a lista de páginas que você quer que os robôs encontrem. Sem ela, páginas importantes podem passar despercebidas.",
    fix: "No Framer, o sitemap é gerado em Configurações do site › General › Sitemap. Ative e publique de novo.",
  });

  // 4. llms.txt
  const hasLlms = llms.ok && llms.text.trim().length > 20 && !/<html/i.test(llms.text.slice(0, 200));
  add({
    id: "llms",
    title: "Guia para IAs (llms.txt)",
    status: hasLlms ? "ok" : "warn",
    weight: 4,
    found: hasLlms ? "O arquivo llms.txt existe." : "Não há llms.txt. É opcional e ainda novo.",
    why: "É um resumo do site escrito para IAs lerem. Ainda não é obrigatório, mas ajuda algumas ferramentas.",
    fix: "Crie um texto curto em /llms.txt com o que a empresa faz, links das páginas principais e contato. No Framer, use um redirecionamento ou hospedagem do arquivo.",
  });

  // 5. título
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  add({
    id: "title",
    title: "Título da página",
    status: title.length >= 20 && title.length <= 65 ? "ok" : title ? "warn" : "fail",
    weight: 8,
    found: title ? `“${title.slice(0, 80)}” (${title.length} caracteres).` : "A página não tem título.",
    why: "O título é a primeira coisa que as IAs leem para saber do que se trata a página.",
    fix: "No Framer: Configurações da página › SEO › Title. Escreva de 20 a 65 caracteres dizendo o que a empresa faz e onde.",
  });

  // 6. meta description
  const desc = meta(html, "description") ?? "";
  add({
    id: "description",
    title: "Descrição da página",
    status: desc.length >= 70 && desc.length <= 170 ? "ok" : desc ? "warn" : "fail",
    weight: 8,
    found: desc ? `${desc.length} caracteres: “${desc.slice(0, 90)}${desc.length > 90 ? "…" : ""}”` : "A página não tem descrição.",
    why: "É o resumo que buscadores e IAs usam para entender e apresentar o seu site.",
    fix: "No Framer: Configurações da página › SEO › Description. Escreva de 70 a 170 caracteres, em frase completa.",
  });

  // 7. H1 e estrutura
  const h1s = html.match(/<h1\b[\s\S]*?<\/h1>/gi) ?? [];
  const h2s = html.match(/<h[23]\b/gi) ?? [];
  add({
    id: "headings",
    title: "Títulos e subtítulos organizados",
    status: h1s.length === 1 && h2s.length >= 2 ? "ok" : h1s.length >= 1 ? "warn" : "fail",
    weight: 10,
    found: `${h1s.length} título principal (H1) e ${h2s.length} subtítulos (H2/H3).`,
    why: "IAs dividem o texto pelos títulos para achar respostas. Um H1 e vários subtítulos deixam o conteúdo fácil de citar.",
    fix: "Use exatamente um H1 por página (o assunto principal) e subtítulos H2/H3 para cada tópico. No Framer, defina o estilo de texto como Heading 1/2/3.",
  });

  // 8. dados estruturados
  const types = jsonLdTypes(html);
  const orgLike = types.some((t) => /^(Organization|LocalBusiness|Corporation|Person|WebSite|Store|ProfessionalService|RealEstateAgent)/i.test(t));
  add({
    id: "schema",
    title: "Dados estruturados (Schema.org)",
    status: types.length === 0 ? "fail" : orgLike ? "ok" : "warn",
    weight: 15,
    found: types.length ? `Encontrados: ${[...new Set(types)].slice(0, 6).join(", ")}.` : "Nenhum dado estruturado encontrado.",
    why: "É uma “ficha técnica” em código que diz às IAs quem é a empresa, o que faz e onde fica. É um dos itens que mais ajuda a ser citado.",
    fix: "No Framer: Configurações do site › Custom Code › Start of <head>, cole um bloco JSON-LD do tipo Organization (nome, logo, site, redes sociais, contato). Peça ao Gemini “Pergunte ao Gemini” para gerar para você.",
  });

  // 9. Open Graph
  const og = ["og:title", "og:description", "og:image"].filter((k) => meta(html, k, "property"));
  add({
    id: "og",
    title: "Cartão de compartilhamento (Open Graph)",
    status: og.length === 3 ? "ok" : og.length > 0 ? "warn" : "fail",
    weight: 4,
    found: `${og.length} de 3 itens (título, descrição, imagem).`,
    why: "Define como o site aparece ao ser compartilhado ou resumido por outras ferramentas.",
    fix: "No Framer: Configurações da página › SEO › Social preview. Preencha título, descrição e imagem.",
  });

  // 10. canonical
  const canonical = (html.match(/<link\b[^>]*>/gi) ?? []).some((t) => (attr(t, "rel") ?? "").toLowerCase() === "canonical");
  add({
    id: "canonical",
    title: "Endereço canônico",
    status: canonical ? "ok" : "warn",
    weight: 4,
    found: canonical ? "Há um endereço canônico." : "Sem endereço canônico.",
    why: "Evita que versões duplicadas da mesma página confundam buscadores e IAs.",
    fix: "O Framer costuma adicionar sozinho em domínios publicados. Verifique se o domínio principal está configurado.",
  });

  // 11. idioma
  const lang = html.match(/<html\b[^>]*\blang\s*=\s*["']([^"']+)["']/i)?.[1];
  add({
    id: "lang",
    title: "Idioma da página",
    status: lang ? "ok" : "warn",
    weight: 3,
    found: lang ? `Idioma: ${lang}.` : "O idioma não está declarado.",
    why: "Ajuda a IA a saber em que língua responder sobre o seu site.",
    fix: "No Framer: Configurações do site › General › Language.",
  });

  // 12. quantidade de texto
  const text = strip(html.replace(/<(nav|footer|header)[\s\S]*?<\/\1>/gi, " "));
  const words = text ? text.split(" ").length : 0;
  add({
    id: "content",
    title: "Texto suficiente para as IAs lerem",
    status: words >= 300 ? "ok" : words >= 120 ? "warn" : "fail",
    weight: 8,
    found: `Cerca de ${words} palavras de texto na página inicial.`,
    why: "IAs respondem com base em texto. Páginas só com imagens ou frases soltas dão pouco para citar.",
    fix: "Explique com texto: o que você faz, para quem, onde atua e por que escolher você. Mire em 300 palavras ou mais na página inicial.",
  });

  // 13. perguntas e respostas
  const questions = (html.match(/<h[1-6]\b[^>]*>[^<]*\?\s*<\/h[1-6]>/gi) ?? []).length;
  const faq = types.some((t) => /FAQPage|Question/i.test(t));
  add({
    id: "faq",
    title: "Perguntas e respostas",
    status: faq || questions >= 3 ? "ok" : questions > 0 ? "warn" : "fail",
    weight: 6,
    found: faq ? "Há FAQ com dados estruturados." : questions ? `${questions} títulos em forma de pergunta.` : "Sem seção de perguntas frequentes.",
    why: "As pessoas perguntam às IAs em forma de pergunta. Páginas que já trazem pergunta e resposta são as mais citadas.",
    fix: "Crie uma seção “Perguntas frequentes” com 5 a 8 perguntas reais de clientes, cada uma com resposta curta. No Framer, use o componente Accordion.",
  });

  // 14. alt das imagens
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  const withAlt = imgs.filter((t) => (attr(t, "alt") ?? "").trim().length > 0).length;
  const ratio = imgs.length ? withAlt / imgs.length : 1;
  add({
    id: "alt",
    title: "Descrição das imagens (alt)",
    status: ratio >= 0.8 ? "ok" : ratio >= 0.4 ? "warn" : "fail",
    weight: 4,
    found: imgs.length ? `${withAlt} de ${imgs.length} imagens têm descrição.` : "Nenhuma imagem encontrada.",
    why: "IAs não enxergam imagens: o texto alternativo é como elas entendem o que a foto mostra.",
    fix: "No Framer, selecione cada imagem e preencha o campo Alt com uma frase curta descrevendo a imagem.",
  });

  const total = checks.reduce((a, c) => a + c.weight, 0);
  const got = checks.reduce((a, c) => a + c.weight * (c.status === "ok" ? 1 : c.status === "warn" ? 0.5 : 0), 0);
  return { score: Math.round((got / total) * 100), checks };
}

export async function runGeoAudit(siteId: string, siteUrl: string) {
  await ensureGeoAuditTable();
  const r = await auditSite(siteUrl);
  await db.execute(sql`INSERT INTO geo_audits (site_id, score, checks) VALUES (${siteId}, ${r.score}, ${JSON.stringify(r.checks)}::jsonb)`);
  await db.execute(sql`DELETE FROM geo_audits WHERE site_id = ${siteId} AND id NOT IN (
    SELECT id FROM geo_audits WHERE site_id = ${siteId} ORDER BY ran_at DESC LIMIT 60)`);
  return r;
}

type Row = Record<string, unknown>;

/** Auditorias do site, da mais recente para a mais antiga. */
export async function getGeoAudits(siteId: string, limit = 30): Promise<GeoAudit[]> {
  await ensureGeoAuditTable();
  const res = (await db.execute(sql`SELECT ran_at, score, checks FROM geo_audits WHERE site_id = ${siteId} ORDER BY ran_at DESC LIMIT ${limit}`)) as unknown as Row[];
  return res.map((r) => ({ ranAt: new Date(String(r.ran_at)), score: Number(r.score), checks: (r.checks as GeoCheck[]) ?? [] }));
}
