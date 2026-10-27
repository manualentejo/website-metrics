export type Strategy = "mobile" | "desktop";

export interface PsiResult {
  performanceScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  seoScore: number | null;
  fcpMs: number | null;
  lcpMs: number | null;
  tbtMs: number | null;
  cls: number | null;
  speedIndexMs: number | null;
  failedSeoAudits: { id: string; title: string; weight: number; score: number | null }[];
  finalScreenshot: string | null;
  thumbnails: { timing: number; data: string }[];
}

const CATEGORY_KEYS = ["performance", "accessibility", "best-practices", "seo"] as const;

export async function runPsi(url: string, strategy: Strategy, apiKey: string): Promise<PsiResult> {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.set("key", apiKey);
  for (const category of CATEGORY_KEYS) {
    endpoint.searchParams.append("category", category);
  }

  const res = await fetch(endpoint.toString());
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PSI API ${res.status}: ${body.slice(0, 500)}`);
  }
  const data = await res.json();

  const categories = data.lighthouseResult?.categories ?? {};
  const audits = data.lighthouseResult?.audits ?? {};

  const toScore100 = (ratio: number | null | undefined) =>
    typeof ratio === "number" ? Math.round(ratio * 100) : null;

  const seoAuditRefs: { id: string; weight: number }[] =
    categories.seo?.auditRefs?.filter((ref: { weight: number }) => ref.weight > 0) ?? [];

  const failedSeoAudits = seoAuditRefs
    .map((ref) => {
      const audit = audits[ref.id];
      if (!audit) return null;
      const score: number | null = audit.score;
      if (score !== null && score >= 1) return null;
      return {
        id: ref.id,
        title: audit.title as string,
        weight: ref.weight,
        score,
      };
    })
    .filter((x): x is { id: string; title: string; weight: number; score: number | null } => x !== null);

  const finalScreenshot: string | null = audits["final-screenshot"]?.details?.data ?? null;

  const thumbnails: { timing: number; data: string }[] =
    audits["screenshot-thumbnails"]?.details?.items?.map((item: { timing: number; data: string }) => ({
      timing: item.timing,
      data: item.data,
    })) ?? [];

  return {
    performanceScore: toScore100(categories.performance?.score),
    accessibilityScore: toScore100(categories.accessibility?.score),
    bestPracticesScore: toScore100(categories["best-practices"]?.score),
    seoScore: toScore100(categories.seo?.score),
    fcpMs: audits["first-contentful-paint"]?.numericValue ?? null,
    lcpMs: audits["largest-contentful-paint"]?.numericValue ?? null,
    tbtMs: audits["total-blocking-time"]?.numericValue ?? null,
    cls: audits["cumulative-layout-shift"]?.numericValue ?? null,
    speedIndexMs: audits["speed-index"]?.numericValue ?? null,
    failedSeoAudits,
    finalScreenshot,
    thumbnails,
  };
}
