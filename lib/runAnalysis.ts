import { and, eq, lt } from "drizzle-orm";
import { runGeoAudit } from "@/lib/geoAudit";
import { db } from "@/db/client";
import { reports, sites, snapshots } from "@/db/schema";
import { runPsi, type Strategy } from "@/lib/psi";
import { saveSettings } from "@/lib/settings";

const RETENTION_WEEKS = 52;
const STRATEGIES: Strategy[] = ["desktop", "mobile"];

type SiteRow = typeof sites.$inferSelect;
export interface SiteResult { site: string; strategy: Strategy; ok: boolean; error?: string }

/** Analisa um site (computador e celular), grava o histórico e o instantâneo mais recente. */
export async function analyzeSite(site: SiteRow, apiKey: string): Promise<SiteResult[]> {
  const results: SiteResult[] = [];
  for (const strategy of STRATEGIES) {
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
      await db.delete(snapshots).where(and(eq(snapshots.siteId, site.id), eq(snapshots.strategy, strategy)));
      await db.insert(snapshots).values({
        siteId: site.id,
        strategy,
        finalScreenshot: psi.finalScreenshot,
        thumbnails: psi.thumbnails,
        analysis: psi.analysis,
      });
      results.push({ site: site.name, strategy, ok: true });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      await db.insert(reports).values({ siteId: site.id, strategy, error });
      results.push({ site: site.name, strategy, ok: false, error });
    }
  }
  const cutoff = new Date(Date.now() - RETENTION_WEEKS * 7 * 24 * 60 * 60 * 1000);
  await db.delete(reports).where(and(eq(reports.siteId, site.id), lt(reports.ranAt, cutoff)));
  // Auditoria GEO técnica junto da análise (só lê o site; sem custo). Falha aqui não derruba o resto.
  try {
    await runGeoAudit(site.id, site.url);
  } catch {
    /* ignorado */
  }
  return results;
}

export async function runAnalysis(apiKey: string) {
  await saveSettings({ lastRunAt: new Date().toISOString() });
  const allSites = await db.select().from(sites);
  const results: SiteResult[] = [];
  for (const site of allSites) results.push(...(await analyzeSite(site, apiKey)));
  return { ranAt: new Date().toISOString(), results };
}
