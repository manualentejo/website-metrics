import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reports, sites } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { askGemini } from "@/lib/gemini";
import { getViewer, getAccessibleSiteIds, canViewSite } from "@/lib/access";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { question } = (await req.json()) as { question: string };

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

  const mobileReports = await db
    .select()
    .from(reports)
    .where(and(eq(reports.siteId, id), eq(reports.strategy, "mobile")))
    .orderBy(desc(reports.ranAt))
    .limit(8);

  const desktopReports = await db
    .select()
    .from(reports)
    .where(and(eq(reports.siteId, id), eq(reports.strategy, "desktop")))
    .orderBy(desc(reports.ranAt))
    .limit(8);

  const summarize = (list: typeof mobileReports) =>
    list
      .filter((r) => !r.error)
      .map((r) => ({
        data: r.ranAt,
        performance: r.performanceScore,
        acessibilidade: r.accessibilityScore,
        boasPraticas: r.bestPracticesScore,
        seo: r.seoScore,
        fcpMs: r.fcpMs,
        lcpMs: r.lcpMs,
        tbtMs: r.tbtMs,
        cls: r.cls,
        speedIndexMs: r.speedIndexMs,
        auditoriasSeoComFalha: r.failedSeoAudits,
      }));

  const context = `Você é um assistente que ajuda uma pessoa leiga em SEO e performance web a entender os
relatórios semanais do Google Lighthouse (via PageSpeed Insights) do site "${site.name}" (${site.url}).

Responda sempre em português do Brasil, em linguagem simples e direta, como se explicasse para alguém
sem conhecimento técnico. Quando fizer sentido, sugira ações concretas e priorizadas que a pessoa (ou a
equipe de desenvolvimento dela) pode tomar para melhorar as métricas. Seja conciso.

Dados históricos (mobile, mais recentes primeiro):
${JSON.stringify(summarize(mobileReports), null, 2)}

Dados históricos (desktop, mais recentes primeiro):
${JSON.stringify(summarize(desktopReports), null, 2)}`;

  try {
    const answer = await askGemini(context, question);
    return NextResponse.json({ answer });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao consultar a IA" },
      { status: 500 }
    );
  }
}
