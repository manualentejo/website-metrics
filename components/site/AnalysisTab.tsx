import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { reports, snapshots } from "@/db/schema";
import AnalysisView from "@/components/analysis/AnalysisView";
import ScoreGauge from "@/components/ScoreGauge";
import InfoTip from "@/components/ui/InfoTip";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Page";
import ChartEmptyState from "@/components/charts/ChartEmptyState";
import { formatDateTime } from "@/lib/format";
import type { CategoryKey } from "@/lib/analysis";
import type { ReportRow, Strategy } from "@/lib/types";

/** Análise detalhada do Lighthouse de um site, restrita às categorias da aba (SEO ou Desempenho). */
export default async function AnalysisTab({
  siteId,
  siteName,
  basePath,
  strategy,
  categories,
  showHistory,
  highlight,
  initialCategory,
}: {
  siteId: string;
  siteName: string;
  basePath: string;
  strategy: Strategy;
  categories: CategoryKey[];
  showHistory: boolean;
  highlight?: string;
  initialCategory?: CategoryKey;
}) {
  const strategyLabel = strategy === "mobile" ? "celular" : "computador";
  const [history, [snapshot]] = await Promise.all([
    db.select().from(reports).where(and(eq(reports.siteId, siteId), eq(reports.strategy, strategy))).orderBy(asc(reports.ranAt)).limit(104),
    db.select().from(snapshots).where(and(eq(snapshots.siteId, siteId), eq(snapshots.strategy, strategy))),
  ]);
  const valid = history.filter((r) => !r.error);
  const latest = valid[valid.length - 1];
  const analysis = snapshot?.analysis ?? null;
  const analyzedAt = analysis?.meta.fetchTime ?? latest?.ranAt;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-paragraph-xs text-text-sub-600">
          {analyzedAt ? (
            <>
              Analisado em {formatDateTime(analyzedAt)}
              {analysis?.meta.lighthouseVersion && <> · Lighthouse {analysis.meta.lighthouseVersion}</>}
              <InfoTip term="lab-data" align="start" />
            </>
          ) : (
            "Sem análise ainda."
          )}
          {highlight && <span className="ml-2 rounded-md bg-bg-weak-50 px-1.5 py-0.5 text-label-xs text-text-sub-600">Aberto a partir de: {highlight}</span>}
        </p>
        <Segmented
          label="Dispositivo"
          items={(["desktop", "mobile"] as Strategy[]).map((x) => ({
            label: x === "mobile" ? "Celular" : "Computador",
            href: `${basePath}?strategy=${x}${initialCategory ? `&cat=${initialCategory}` : ""}`,
            active: strategy === x,
          }))}
        />
      </div>

      {analysis ? (
        <AnalysisView
          analysis={analysis}
          finalScreenshot={snapshot?.finalScreenshot ?? null}
          thumbnails={snapshot?.thumbnails ?? []}
          history={valid as unknown as ReportRow[]}
          siteName={siteName}
          strategyLabel={strategyLabel}
          categories={categories}
          showHistory={showHistory}
          initialCategory={initialCategory}
        />
      ) : latest ? (
        <Card className="p-8">
          <div className="flex flex-wrap justify-around gap-6">
            <ScoreGauge score={latest.performanceScore} label="Desempenho" size={90} />
            <ScoreGauge score={latest.seoScore} label="SEO" size={90} />
          </div>
          <p className="mt-6 text-center text-paragraph-sm text-text-sub-600">A análise detalhada aparece a partir da próxima execução.</p>
        </Card>
      ) : (
        <ChartEmptyState title={`Sem dados no ${strategyLabel}`} className="h-48">
          A primeira análise roda na próxima sexta-feira às 15h (Brasília), ou use <span className="text-text-strong-950">Executar auditoria</span>.{" "}
          <Link href={`/site/${siteId}`} className="underline">Voltar à visão geral</Link>
        </ChartEmptyState>
      )}
    </>
  );
}
