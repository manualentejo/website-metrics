import { createHash } from "node:crypto";
import { loadPortfolio } from "@/lib/portfolio";
import type { Viewer } from "@/lib/access";

export const NUMA_PERSONA = `Você é a Numa, a assistente do painel de métricas de sites. Ajuda uma pessoa leiga a entender
os dados de Lighthouse (desempenho, acessibilidade, boas práticas, SEO) e de GEO (preparo dos sites para serem
citados por IAs como ChatGPT, Gemini e Perplexity).

Regras:
- Português do Brasil, simples e direta. Explique siglas na primeira vez (LCP, GEO, SEO).
- Os sites são feitos no Framer: ao sugerir correções, diga onde clicar no Framer.
- Use SOMENTE os dados fornecidos abaixo. Se faltar informação, diga que não tem. Nunca invente números, causas ou sites.
- Não prometa resultados de posição no Google nem de citações em IAs.`;

/** Fatos do portfólio do viewer, em texto compacto, para a Numa se basear. */
export async function portfolioFacts(viewer: Viewer) {
  const p = await loadPortfolio(viewer, { days: 28 });
  const round = (n: number | null) => (n === null ? null : Math.round(n));
  const facts = {
    atualizadoEm: p.lastUpdate,
    sites: p.rows.map((r) => ({
      nome: r.name,
      endereco: r.url,
      status: r.status === "no_ar" ? "no ar" : "em andamento",
      seoComputador: round(r.seo),
      variacaoSeo: round(r.seoDelta),
      desempenhoComputador: round(r.performance),
      variacaoDesempenho: round(r.performanceDelta),
      notaGeo: round(r.geo),
    })),
    problemasAbertos: p.attention.map((a) => ({
      site: a.siteName,
      problema: a.title,
      gravidade: a.severity === "critical" ? "crítico" : "atenção",
      categoria: a.category,
      dispositivo: a.strategy === "mobile" ? "celular" : "computador",
      detalhe: a.detail,
    })),
    resumoPorRegras: p.insights.map((i) => ({ item: i.label, texto: i.text })),
  };
  const text = JSON.stringify(facts);
  return { facts, text, hash: createHash("sha1").update(text).digest("hex"), portfolio: p };
}
