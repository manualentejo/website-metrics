import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { sites, reports, folders } from "@/db/schema";
import { and, asc, desc, eq, isNull } from "drizzle-orm";
import Sidebar from "@/components/Sidebar";
import SiteSummaryCard from "@/components/SiteSummaryCard";
import { getViewer, getAccessibleSiteIds, canViewSite } from "@/lib/access";
import type { Status } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusFilter } = await searchParams;

  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const accessibleSiteIds = viewer.owner ? new Set<string>() : await getAccessibleSiteIds(viewer.email);

  const allSitesRaw = await db.select().from(sites).orderBy(asc(sites.sortOrder));
  const allFolders = await db.select().from(folders).orderBy(asc(folders.sortOrder));

  const visibleSites = allSitesRaw.filter((s) => canViewSite(viewer, s, accessibleSiteIds, s.id));

  const sitesWithLatest = await Promise.all(
    visibleSites.map(async (site) => {
      const [latest] = await db
        .select()
        .from(reports)
        .where(and(eq(reports.siteId, site.id), eq(reports.strategy, "mobile"), isNull(reports.error)))
        .orderBy(desc(reports.ranAt))
        .limit(1);
      return { ...site, latest: latest ?? null };
    })
  );

  const filtered = statusFilter ? sitesWithLatest.filter((s) => s.status === statusFilter) : sitesWithLatest;

  return (
    <div className="flex">
      <Sidebar
        sites={visibleSites.map((s) => ({
          id: s.id,
          name: s.name,
          status: s.status as Status,
          folderId: s.folderId,
        }))}
        folders={allFolders}
        statusFilter={statusFilter}
        userEmail={viewer.email}
        isOwner={viewer.owner}
      />

      <main className="min-h-screen flex-1 overflow-y-auto p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Visão geral</h1>
          <p className="mt-1 text-sm text-slate-500">
            Lighthouse via PageSpeed Insights, atualizado toda sexta-feira às 15h (horário de Brasília). Clique
            em um site para ver a análise completa.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((site) => (
            <SiteSummaryCard
              key={site.id}
              id={site.id}
              name={site.name}
              url={site.url}
              status={site.status as Status}
              latest={site.latest}
              readOnly={!viewer.owner}
            />
          ))}
        </div>

        {filtered.length === 0 && <p className="text-sm text-slate-400">Nenhum site nesse filtro.</p>}
      </main>
    </div>
  );
}
