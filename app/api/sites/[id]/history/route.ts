import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reports, sites } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { getViewer, getAccessibleSiteIds, canViewSite } from "@/lib/access";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const strategy = req.nextUrl.searchParams.get("strategy") === "desktop" ? "desktop" : "mobile";

  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const [site] = await db.select().from(sites).where(eq(sites.id, id));
  if (!site) return NextResponse.json({ error: "Site não encontrado" }, { status: 404 });

  const accessibleSiteIds = viewer.owner ? new Set<string>() : await getAccessibleSiteIds(viewer.email);
  if (!canViewSite(viewer, site, accessibleSiteIds, site.id)) {
    return NextResponse.json({ error: "Site não encontrado" }, { status: 404 });
  }

  const history = await db
    .select()
    .from(reports)
    .where(and(eq(reports.siteId, id), eq(reports.strategy, strategy)))
    .orderBy(asc(reports.ranAt));

  return NextResponse.json(history);
}
