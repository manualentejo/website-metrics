import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sites, reports } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const allSites = await db.select().from(sites).orderBy(asc(sites.sortOrder));

  const withLatest = await Promise.all(
    allSites.map(async (site) => {
      const latest = await db
        .select()
        .from(reports)
        .where(eq(reports.siteId, site.id))
        .orderBy(desc(reports.ranAt))
        .limit(10);
      return { ...site, latestReports: latest };
    })
  );

  return NextResponse.json(withLatest);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status } = body as { id: string; status: string };

  if (!id || !["no_ar", "em_andamento"].includes(status)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await db.update(sites).set({ status }).where(eq(sites.id, id));
  return NextResponse.json({ ok: true });
}
