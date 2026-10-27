import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { db } from "@/db/client";
import { sites, reports, snapshots, folders, siteAccess } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import Sidebar from "@/components/Sidebar";
import ScoreGauge from "@/components/ScoreGauge";
import StatusSelect from "@/components/StatusSelect";
import SharingPanel from "@/components/SharingPanel";
import AnalysisView from "@/components/analysis/AnalysisView";
import AskGeminiButton from "@/components/gemini/AskGeminiButton";
import GeminiDrawer from "@/components/gemini/GeminiDrawer";
import InfoTip from "@/components/ui/InfoTip";
import { Card } from "@/components/ui/Card";
import { getViewer, getAccessibleSiteIds, canViewSite } from "@/lib/access";
import { formatDateTime } from "@/lib/format";
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
  const strategyLabel = strategy === "mobile" ? "celular" : "computador";

  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const accessibleSiteIds = viewer.owner ? new Set<string>() : await getAccessibleSiteIds(viewer.email);

  const [allSites, allFolders] = await Promise.all([
    db.select().from(sites).orderBy(asc(sites.sortOrder)),
    db.select().from(folders).orderBy(asc(folders.sortOrder)),
  ]);
  const site = allSites.find((s) => s.id === id);
  if (!site || !canViewSite(viewer, site, accessibleSiteIds, site.id)) notFound();

  const visibleSites = allSites.filter((s) => canViewSite(viewer, s, accessibleSiteIds, s.id));
  const folder = allFolders.find((f) => f.id === site.folderId);

  const [history, [snapshot], accessRows] = await Promise.all([
    db
      .select()
      .from(reports)
      .where(and(eq(reports.siteId, id), eq(reports.strategy, strategy)))
      .orderBy(asc(reports.ranAt))
      .limit(104),
    db.select().from(snapshots).where(and(eq(snapshots.siteId, id), eq(snapshots.strategy, strategy))),
    viewer.owner ? db.select().from(siteAccess).where(eq(siteAccess.siteId, id)) : Promise.resolve([]),
  ]);

  const validHistory = history.filter((r) => !r.error);
  const latest = validHistory[validHistory.length - 1];
  const analysis = snapshot?.analysis ?? null;
  const analyzedAt = analysis?.meta.fetchTime ?? latest?.ranAt;

  const strategyHref = (s: Strategy) => `/site/${id}?strategy=${s}${statusFilter ? `&status=${statusFilter}` : ""}`;

  return (
    <div className="flex">
      <Sidebar
        sites={visibleSites.map((s) => ({ id: s.id, name: s.name, status: s.status as Status, folderId: s.folderId }))}
        folders={allFolders}
        activeSiteId={id}
        statusFilter={statusFilter}
        userEmail={viewer.email}
        isOwner={viewer.owner}
      />

      <main className="h-screen flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8">
          <nav aria-label="Caminho" className="mb-4 flex items-center gap-1 text-xs text-slate-400">
            <Link href="/" className="hover:text-slate-700">Sites</Link>
            {folder && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span>{folder.name}</span>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600">{site.name}</span>
          </nav>

          <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{site.name}</h1>
              <a
                href={site.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"
              >
                {site.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              {analyzedAt && (
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                  Analisado em {formatDateTime(analyzedAt)}
                  {analysis?.meta.lighthouseVersion && <> · Lighthouse {analysis.meta.lighthouseVersion}</>}
                  <InfoTip term="lab-data" align="start" />
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-surface-border bg-white p-0.5 text-sm shadow-sm">
                {(["mobile", "desktop"] as Strategy[]).map((s) => (
                  <Link
                    key={s}
                    href={strategyHref(s)}
                    aria-current={strategy === s ? "page" : undefined}
                    className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                      strategy === s ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {s === "mobile" ? "Celular" : "Computador"}
                  </Link>
                ))}
                <span className="px-1.5">
                  <InfoTip term={strategy} align="end" />
                </span>
              </div>
              <StatusSelect siteId={site.id} status={site.status as Status} readOnly={!viewer.owner} />
              <AskGeminiButton />
            </div>
          </header>

          {analysis ? (
            <AnalysisView
              analysis={analysis}
              finalScreenshot={snapshot?.finalScreenshot ?? null}
              thumbnails={snapshot?.thumbnails ?? []}
              history={validHistory as unknown as ReportRow[]}
              siteName={site.name}
              strategyLabel={strategyLabel}
            />
          ) : latest ? (
            <Card className="p-8">
              <div className="flex flex-wrap justify-around gap-6">
                <ScoreGauge score={latest.performanceScore} label="Desempenho" size={90} />
                <ScoreGauge score={latest.accessibilityScore} label="Acessibilidade" size={90} />
                <ScoreGauge score={latest.bestPracticesScore} label="Boas práticas" size={90} />
                <ScoreGauge score={latest.seoScore} label="SEO" size={90} />
              </div>
              <p className="mt-6 text-center text-sm text-slate-500">
                A análise detalhada (Insights, Diagnóstico e auditorias) aparece a partir da próxima execução.
              </p>
            </Card>
          ) : (
            <Card className="p-10 text-center text-sm text-slate-500">
              Ainda não há dados para este site no {strategyLabel}. A primeira análise roda na próxima sexta-feira
              às 15h (horário de Brasília).
            </Card>
          )}

          {viewer.owner && (
            <div className="mt-6">
              <SharingPanel
                siteId={site.id}
                visibility={site.visibility as "private" | "shared"}
                initialEmails={accessRows.map((r) => r.email)}
                folders={allFolders}
                currentFolderId={site.folderId}
              />
            </div>
          )}
        </div>
      </main>

      <GeminiDrawer siteId={site.id} siteName={site.name} />
    </div>
  );
}
