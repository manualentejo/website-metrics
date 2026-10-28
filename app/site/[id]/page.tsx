import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { db } from "@/db/client";
import { sites, reports, snapshots, folders, siteAccess } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import AppShell from "@/components/AppShell";
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
import { Segmented } from "@/components/ui/Page";
import { buttonClass } from "@/components/ui/Button";
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
  const strategy: Strategy = strategyParam === "mobile" ? "mobile" : "desktop";
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
    <AppShell activeSiteId={id} activeFolderId={undefined}>
        <div className="mx-auto max-w-5xl px-8 py-6">
          <nav aria-label="Caminho" className="mb-4 flex items-center gap-1 text-xs text-muted-foreground">
            <Link href="/sites" className="hover:text-foreground/80">Sites</Link>
            {folder && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span>{folder.name}</span>
              </>
            )}
            <ChevronRight className="h-3 w-3" />
            <span className="text-muted-foreground">{site.name}</span>
          </nav>

          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{site.name}</h1>
              <a
                href={site.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {site.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              {analyzedAt && (
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  Analisado em {formatDateTime(analyzedAt)}
                  {analysis?.meta.lighthouseVersion && <> · Lighthouse {analysis.meta.lighthouseVersion}</>}
                  <InfoTip term="lab-data" align="start" />
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                label="Dispositivo"
                items={(["desktop", "mobile"] as Strategy[]).map((x) => ({
                  label: x === "mobile" ? "Celular" : "Computador",
                  href: strategyHref(x),
                  active: strategy === x,
                }))}
              />
              <StatusSelect siteId={site.id} status={site.status as Status} readOnly={!viewer.owner} />
              <Link href={`/site/${id}/analytics`} className={buttonClass("outline", "md")}>Visitas</Link>
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
              <p className="mt-6 text-center text-sm text-muted-foreground">
                A análise detalhada (Insights, Diagnóstico e auditorias) aparece a partir da próxima execução.
              </p>
            </Card>
          ) : (
            <Card className="p-10 text-center text-sm text-muted-foreground">
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
      <GeminiDrawer siteId={site.id} siteName={site.name} />
    </AppShell>
  );
}
