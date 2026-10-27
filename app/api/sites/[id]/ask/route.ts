import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reports, sites, snapshots } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { askGemini, type ChatTurn } from "@/lib/gemini";
import { getViewer, getAccessibleSiteIds, canViewSite } from "@/lib/access";
import { auditStatus, CATEGORY_KEYS, type Analysis } from "@/lib/analysis";
import { formatCell } from "@/lib/format";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Resume os problemas da análise mais recente para caber no contexto da IA. */
function summarizeIssues(analysis: Analysis | null | undefined) {
  if (!analysis) return [];
  const issues: Record<string, unknown>[] = [];
  for (const key of CATEGORY_KEYS) {
    for (const ref of analysis.categories[key].auditRefs) {
      const audit = analysis.audits[ref.id];
      if (!audit) continue;
      const status = auditStatus(audit);
      if (status !== "fail" && status !== "average") continue;
      const exemplos = audit.details?.items.slice(0, 3).map((row) =>
        audit.details!.headings
          .map((h) => `${h.label || h.key}: ${formatCell(row[h.key], h.valueType)}`)
          .join(" | ")
      );
      issues.push({
        categoria: analysis.categories[key].title,
        auditoria: audit.title,
        id: ref.id,
        gravidade: status === "fail" ? "crítico" : "atenção",
        valor: audit.displayValue,
        exemplos,
      });
    }
  }
  return issues;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { question, history } = (await req.json()) as { question: string; history?: ChatTurn[] };

  if (!question || question.trim().length === 0) {
    return NextResponse.json({ error: "Pergunta vazia" }, { status: 400 });
  }

  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const [site] = await db.select().from(sites).where(eq(sites.id, id));
  if (!site) {
    return NextResponse.json({ error: "Site não encontrado" }, { status: 404 });
  }

  const accessibleSiteIds = viewer.owner ? new Set<string>() : await getAccessibleSiteIds(viewer.email);
  if (!canViewSite(viewer, site, accessibleSiteIds, site.id)) {
    return NextResponse.json({ error: "Site não encontrado" }, { status: 404 });
  }

  const [mobileReports, desktopReports, siteSnapshots] = await Promise.all([
    db.select().from(reports).where(and(eq(reports.siteId, id), eq(reports.strategy, "mobile"))).orderBy(desc(reports.ranAt)).limit(8),
    db.select().from(reports).where(and(eq(reports.siteId, id), eq(reports.strategy, "desktop"))).orderBy(desc(reports.ranAt)).limit(8),
    db.select().from(snapshots).where(eq(snapshots.siteId, id)),
  ]);

  const summarize = (list: typeof mobileReports) =>
    list
      .filter((r) => !r.error)
      .map((r) => ({
        data: r.ranAt,
        desempenho: r.performanceScore,
        acessibilidade: r.accessibilityScore,
        boasPraticas: r.bestPracticesScore,
        seo: r.seoScore,
        fcpMs: r.fcpMs,
        lcpMs: r.lcpMs,
        tbtMs: r.tbtMs,
        cls: r.cls,
        speedIndexMs: r.speedIndexMs,
      }));

  const snapshotFor = (strategy: string) => siteSnapshots.find((s) => s.strategy === strategy)?.analysis;

  const context = `Você é um consultor de performance web e SEO que ajuda uma pessoa leiga a entender os
relatórios semanais do Google Lighthouse (PageSpeed Insights) do site "${site.name}" (${site.url}).

Contexto importante: os sites são construídos no Framer (framer.com). Sempre que sugerir uma correção,
explique como fazê-la DENTRO do Framer (painel de propriedades, configurações do site, otimização de
imagens do Framer, Site Settings > SEO/General, código customizado em Site Settings > Custom Code,
componentes, fontes, embeds, etc.). Se algo não for possível de corrigir no Framer (por exemplo,
scripts que o próprio Framer injeta), diga isso com clareza e indique o que dá para fazer em volta.

Regras de resposta:
- Português do Brasil, linguagem simples, explicando siglas na primeira vez que aparecerem.
- Seja direto e prático; use listas curtas e passos numerados quando for um "como fazer".
- Priorize pelo impacto na nota e na experiência de quem visita.
- Use apenas os dados abaixo; se faltar informação, diga.

Notas históricas — celular (mais recentes primeiro):
${JSON.stringify(summarize(mobileReports))}

Notas históricas — computador (mais recentes primeiro):
${JSON.stringify(summarize(desktopReports))}

Problemas encontrados na última análise — celular:
${JSON.stringify(summarizeIssues(snapshotFor("mobile")))}

Problemas encontrados na última análise — computador:
${JSON.stringify(summarizeIssues(snapshotFor("desktop")))}`;

  const safeHistory = (history ?? [])
    .filter((t) => (t.role === "user" || t.role === "assistant") && typeof t.text === "string")
    .slice(-6);

  try {
    const answer = await askGemini(context, question, safeHistory);
    return NextResponse.json({ answer });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao consultar a IA" },
      { status: 500 }
    );
  }
}
