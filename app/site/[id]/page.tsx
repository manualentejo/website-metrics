import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { sites, reports, snapshots } from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import Sidebar from "@/components/Sidebar";
import ScoreGauge from "@/components/ScoreGauge";
import VitalsGrid from "@/components/VitalsGrid";
import FailedSeoAudits from "@/components/FailedSeoAudits";
import Filmstrip from "@/components/Filmstrip";
import ScoreChart from "@/components/ScoreChart";
import StatusSelect from "@/components/StatusSelect";
import ChatWidget from "@/components/ChatWidget";
import { categoryExplanations } from "@/lib/metricExplanations";
import type { ReportRow, Status, Strategy } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SiteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ strategy?: string; status?: string }>;
}) {
  const { id } = await params;
  const { strategy: strategyParam, status: statusFilter } = await searchParams;
  const strategy: Strategy = strategyParam === "desktop" ? "desktop" : "mobile";

  const allSites = await db.select().from(sites).orderBy(asc(sites.sortOrder));
  const site = allSites.find((s) => s.id === id);
  if (!site) notFound();

  const history = await db
    .select()
    .from(reports)
    .where(and(eq(reports.siteId, id), eq(reports.strategy, strategy)))
    .orderBy(asc(reports.ranAt))
    .limit(104);

  const validHistory = history.filter((r) => !r.error);
  const latest = validHistory[validHistory.length - 1];

  const [snapshot] = await db
    .select()
    .from(snapshots)
    .where(and(eq(snapshots.siteId, id), eq(snapshots.strategy, strategy)));

  return (
    <div className="flex">
      <Sidebar
        sites={allSites.map((s) => ({ id: s.id, name: s.name, status: s.status as Status }))}
        activeSiteId={id}
        statusFilter={statusFilter}
      />

      <main className="min-h-screen flex-1 overflow-y-auto p-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{site.name}</h1>
            <a href={site.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:text-indigo-700">
              {site.url}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-surface-border bg-white p-0.5 text-sm">
              {(["mobile", "desktop"] as Strategy[]).map((s) => (
                <a
                  key={s}
                  href={`/site/${id}?strategy=${s}${statusFilter ? `&status=${statusFilter}` : ""}`}
                  className={`rounded-md px-3 py-1 transition-colors ${
                    strategy === s ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {s === "mobile" ? "Mobile" : "Desktop"}
                </a>
              ))}
            </div>
            <StatusSelect siteId={site.id} status={site.status as Status} />
          </div>
        </header>

        {!latest ? (
          <div className="rounded-2xl border border-surface-border bg-surface-raised p-10 text-center text-slate-500">
            Ainda não há dados para este site nesta estratégia. A primeira análise roda na próxima sexta-feira
            às 15h (horário de Brasília).
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
              <div className="flex flex-wrap justify-around gap-6">
                <ScoreGauge score={latest.performanceScore} label={categoryExplanations.performance.label} size={100} />
                <ScoreGauge score={latest.accessibilityScore} label={categoryExplanations.accessibility.label} size={100} />
                <ScoreGauge score={latest.bestPracticesScore} label={categoryExplanations.bestPractices.label} size={100} />
                <ScoreGauge score={latest.seoScore} label={categoryExplanations.seo.label} size={100} />
              </div>
              <div className="mt-6 grid gap-3 border-t border-surface-border pt-4 sm:grid-cols-2">
                {Object.values(categoryExplanations).map((c) => (
                  <p key={c.label} className="text-xs leading-snug text-slate-500">
                    <span className="font-medium text-slate-700">{c.label}:</span> {c.description}
                  </p>
                ))}
              </div>
            </div>

            <VitalsGrid
              fcpMs={latest.fcpMs}
              lcpMs={latest.lcpMs}
              tbtMs={latest.tbtMs}
              cls={latest.cls}
              speedIndexMs={latest.speedIndexMs}
            />

            {snapshot && (
              <Filmstrip finalScreenshot={snapshot.finalScreenshot} thumbnails={snapshot.thumbnails ?? []} />
            )}

            <FailedSeoAudits audits={latest.failedSeoAudits ?? []} />

            <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">Histórico (últimas semanas)</h3>
              <ScoreChart reports={validHistory as unknown as ReportRow[]} />
            </div>

            <ChatWidget siteId={site.id} siteName={site.name} />
          </div>
        )}
      </main>
    </div>
  );
}
