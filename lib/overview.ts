import { and, asc, desc, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { sites, reports, folders } from "@/db/schema";
import { getAccessibleSiteIds, canViewSite, type Viewer } from "@/lib/access";

export async function loadOverview(viewer: Viewer) {
  const accessible = viewer.owner ? new Set<string>() : await getAccessibleSiteIds(viewer.email);
  const [allSites, allFolders] = await Promise.all([
    db.select().from(sites).orderBy(asc(sites.sortOrder), asc(sites.createdAt)),
    db.select().from(folders).orderBy(asc(folders.sortOrder), asc(folders.createdAt)),
  ]);
  const visible = allSites.filter((s) => canViewSite(viewer, s, accessible, s.id));
  const recent = visible.length
    ? await db
        .select()
        .from(reports)
        .where(and(inArray(reports.siteId, visible.map((s) => s.id)), isNull(reports.error)))
        .orderBy(desc(reports.ranAt))
        .limit(visible.length * 12)
    : [];
  const rows = visible.map((site) => ({
    ...site,
    mobile: recent.find((r) => r.siteId === site.id && r.strategy === "mobile") ?? null,
  }));
  return { visible, folders: allFolders, rows, lastRun: recent[0]?.ranAt ?? null };
}

export type OverviewRow = Awaited<ReturnType<typeof loadOverview>>["rows"][number];
