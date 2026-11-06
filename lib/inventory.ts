import { asc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { folders } from "@/db/schema";
import { ensureGeoAuditTable } from "@/lib/geoAudit";
import { loadReportLog } from "@/lib/insights";
import type { Viewer } from "@/lib/access";
import type { InventoryRow, Cell, Device } from "@/components/overview/WebsiteInventory";
import type { Status } from "@/lib/types";

const cell = (cur: number | null | undefined, prev: number | null | undefined): Cell => ({
  v: typeof cur === "number" ? cur : null,
  d: typeof cur === "number" && typeof prev === "number" ? cur - prev : null,
});

/** Linhas da lista de sites (Sites e workspaces): notas dos dois dispositivos, variação e nota GEO. */
export async function loadInventory(viewer: Viewer) {
  const [{ visible, log }, allFolders] = await Promise.all([
    loadReportLog(viewer, 900),
    db.select().from(folders).orderBy(asc(folders.sortOrder), asc(folders.createdAt)),
  ]);

  let geo = new Map<string, number>();
  try {
    await ensureGeoAuditTable();
    const res = (await db.execute(sql`SELECT DISTINCT ON (site_id) site_id::text AS id, score FROM geo_audits
      WHERE NOT (score = 0 AND jsonb_array_length(checks) = 1) ORDER BY site_id, ran_at DESC`)) as unknown as { id: string; score: number }[];
    geo = new Map(res.map((r) => [String(r.id), Number(r.score)]));
  } catch {
    /* sem GEO a lista continua funcionando */
  }

  const folderName = new Map(allFolders.map((f) => [f.id, f.name]));
  const rows: InventoryRow[] = visible.map((s) => {
    const m = {} as InventoryRow["m"];
    for (const d of ["desktop", "mobile"] as Device[]) {
      const [now, before] = log.filter((r) => r.siteId === s.id && r.strategy === d);
      m[d] = {
        p: cell(now?.performanceScore, before?.performanceScore),
        a: cell(now?.accessibilityScore, before?.accessibilityScore),
        b: cell(now?.bestPracticesScore, before?.bestPracticesScore),
        s: cell(now?.seoScore, before?.seoScore),
        at: now ? new Date(now.ranAt).toISOString() : null,
      };
    }
    return {
      id: s.id,
      name: s.name,
      url: s.url,
      status: s.status as Status,
      folderId: s.folderId,
      folder: s.folderId ? (folderName.get(s.folderId) ?? null) : null,
      geo: geo.get(s.id) ?? null,
      createdAt: new Date(s.createdAt).toISOString(),
      m,
    };
  });
  return { rows, folders: allFolders };
}
