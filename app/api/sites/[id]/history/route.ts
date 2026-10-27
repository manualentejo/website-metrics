import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reports } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const strategy = req.nextUrl.searchParams.get("strategy") === "desktop" ? "desktop" : "mobile";

  const history = await db
    .select()
    .from(reports)
    .where(and(eq(reports.siteId, id), eq(reports.strategy, strategy)))
    .orderBy(asc(reports.ranAt));

  return NextResponse.json(history);
}
