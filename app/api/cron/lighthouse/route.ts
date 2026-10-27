import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { reports, sites } from "@/db/schema";
import { runPsi, type Strategy } from "@/lib/psi";
import { and, eq, lt } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const RETENTION_WEEKS = 52;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "PAGESPEED_API_KEY not configured" }, { status: 500 });
  }

  const allSites = await db.select().from(sites);
  const strategies: Strategy[] = ["mobile", "desktop"];
  const results: { site: string; strategy: Strategy; ok: boolean; error?: string }[] = [];

  for (const site of allSites) {
    for (const strategy of strategies) {
      try {
        const psi = await runPsi(site.url, strategy, apiKey);
        await db.insert(reports).values({
          siteId: site.id,
          strategy,
          performanceScore: psi.performanceScore,
          accessibilityScore: psi.accessibilityScore,
          bestPracticesScore: psi.bestPracticesScore,
          seoScore: psi.seoScore,
          fcpMs: psi.fcpMs,
          lcpMs: psi.lcpMs,
          tbtMs: psi.tbtMs,
          cls: psi.cls,
          speedIndexMs: psi.speedIndexMs,
          failedSeoAudits: psi.failedSeoAudits,
        });
        results.push({ site: site.name, strategy, ok: true });
      } catch (err) {
        await db.insert(reports).values({
          siteId: site.id,
          strategy,
          error: err instanceof Error ? err.message : String(err),
        });
        results.push({
          site: site.name,
          strategy,
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const cutoff = new Date(Date.now() - RETENTION_WEEKS * 7 * 24 * 60 * 60 * 1000);
    await db.delete(reports).where(and(eq(reports.siteId, site.id), lt(reports.ranAt, cutoff)));
  }

  return NextResponse.json({ ranAt: new Date().toISOString(), results });
}
