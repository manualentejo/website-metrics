import { db } from "@/db/client";
import { sites, reports } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import Dashboard from "@/components/Dashboard";
import type { SiteRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const allSites = await db.select().from(sites).orderBy(asc(sites.sortOrder));

  const sitesWithReports = await Promise.all(
    allSites.map(async (site) => {
      const siteReports = await db
        .select()
        .from(reports)
        .where(eq(reports.siteId, site.id))
        .orderBy(desc(reports.ranAt))
        .limit(104); // 52 semanas x 2 estratégias
      return { ...site, reports: siteReports };
    })
  );

  return <Dashboard sites={sitesWithReports as unknown as SiteRow[]} />;
}
