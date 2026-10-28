import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db/client";
import { sites, reports, folders } from "@/db/schema";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import Sidebar from "@/components/Sidebar";
import ScoreGauge from "@/components/ScoreGauge";
import StatusSelect from "@/components/StatusSelect";
import { Card, CardHeader } from "@/components/ui/Card";
import { getViewer, getAccessibleSiteIds, canViewSite } from "@/lib/access";
import { formatDateTime } from "@/lib/format";
import type { Status } from "@/lib/types";

export const dynamic = "force-dynamic";

function Bar({ value }: { value: number | null }) {
  const color = value === null ? "bg-border" : value >= 90 ? "bg-success" : value >= 50 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value ?? 0}%` }} />
      </div>
      <span className="w-6 text-sm tabular-nums text-foreground">{value === null ? "—" : Math.round(value)}</span>
    </div>
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusFilter } = await searchParams;

  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const accessibleSiteIds = viewer.owner ? new Set<string>() : await getAccessibleSiteIds(viewer.email);
  const [allSitesRaw, allFolders] = await Promise.all([
    db.select().from(sites).orderBy(asc(sites.sortOrder)),
    db.select().from(folders).orderBy(asc(folders.sortOrder)),
  ]);
  const visibleSites = allSitesRaw.filter((s) => canViewSite(viewer, s, accessibleSiteIds, s.id));

  const recent = visibleSites.length
    ? await db
        .select()
        .from(reports)
        .where(and(inArray(reports.siteId, visibleSites.map((s) => s.id)), isNull(reports.error)))
        .orderBy(desc(reports.ranAt))
        .limit(visibleSites.length * 12)
    : [];

  const rows = visibleSites.map((site) => ({
    ...site,
    mobile: recent.find((r) => r.siteId === site.id && r.strategy === "mobile") ?? null,
    desktop: recent.find((r) => r.siteId === site.id && r.strategy === "desktop") ?? null,
  }));
  const filtered = statusFilter ? rows.filter((r) => r.status === statusFilter) : rows;

  const avg = (key: "performanceScore" | "accessibilityScore" | "bestPracticesScore" | "seoScore") => {
    const vals = rows.map((r) => r.mobile?.[key]).filter((v): v is number => typeof v === "number");
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };
  const avgAll = [avg("performanceScore"), avg("accessibilityScore"), avg("bestPracticesScore"), avg("seoScore")].filter(
    (v): v is number => v !== null
  );
  const overall = avgAll.length ? Math.round(avgAll.reduce((a, b) => a + b, 0) / avgAll.length) : null;
  const lastRun = recent[0]?.ranAt;
  const live = rows.filter((r) => r.status === "no_ar").length;
  const folderName = (id: string | null) => allFolders.find((f) => f.id === id)?.name;

  const stat = (label: string, value: string | number, hint: string) => (
    <Card className="p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );

  return (
    <div className="flex">
      <Sidebar
        sites={visibleSites.map((s) => ({ id: s.id, name: s.name, status: s.status as Status, folderId: s.folderId }))}
        folders={allFolders}
        statusFilter={statusFilter}
        userEmail={viewer.email}
        isOwner={viewer.owner}
      />

      <main className="h-screen flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Visão geral</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Lighthouse via PageSpeed Insights, atualizado toda sexta-feira às 15h (horário de Brasília).
            </p>
          </header>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {stat("Sites monitorados", rows.length, `${live} no ar · ${rows.length - live} em andamento`)}
            {stat("Nota média (celular)", overall ?? "—", "Média das 4 categorias")}
            {stat("Última análise", lastRun ? formatDateTime(lastRun).split(",")[0] : "—", lastRun ? formatDateTime(lastRun) : "Aguardando a primeira")}
          </div>

          <Card className="overflow-hidden">
            <CardHeader title="Sites monitorados" description="Clique em um site para ver a análise completa." />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-y border-border bg-secondary/60 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-2.5">Site</th>
                    <th className="px-3 py-2.5">Desempenho</th>
                    <th className="px-3 py-2.5">Acessib.</th>
                    <th className="px-3 py-2.5">Boas práticas</th>
                    <th className="px-3 py-2.5">SEO</th>
                    <th className="px-6 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((site) => (
                    <tr key={site.id} className="border-b border-border last:border-b-0 hover:bg-secondary/40">
                      <td className="px-6 py-3.5">
                        <Link href={`/site/${site.id}`} className="flex items-center gap-3">
                          <ScoreGauge
                            score={site.mobile?.performanceScore ?? null}
                            label=""
                            size={40}
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-foreground">{site.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {folderName(site.folderId) ? `${folderName(site.folderId)} · ` : ""}
                              {site.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-3 py-3.5"><Bar value={site.mobile?.performanceScore ?? null} /></td>
                      <td className="px-3 py-3.5"><Bar value={site.mobile?.accessibilityScore ?? null} /></td>
                      <td className="px-3 py-3.5"><Bar value={site.mobile?.bestPracticesScore ?? null} /></td>
                      <td className="px-3 py-3.5"><Bar value={site.mobile?.seoScore ?? null} /></td>
                      <td className="px-6 py-3.5 text-right">
                        <StatusSelect siteId={site.id} status={site.status as Status} readOnly={!viewer.owner} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="px-6 py-8 text-center text-sm text-muted-foreground">Nenhum site nesse filtro.</p>}
            </div>
            <p className="border-t border-border px-6 py-3 text-xs text-muted-foreground">Notas da análise para celular.</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
