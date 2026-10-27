import type { Analysis, CategoryKey, DetailsTable, StoredAudit } from "./analysis";

export type Strategy = "mobile" | "desktop";

export interface PsiResult {
  analysis: Analysis;
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

const CATEGORY_KEYS: CategoryKey[] = ["performance", "accessibility", "best-practices", "seo"];
const MAX_DETAIL_ITEMS = 8;

/* eslint-disable @typescript-eslint/no-explicit-any */
function cellValue(value: any): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return value.length > 160 ? `${value.slice(0, 160)}…` : value;
  if (typeof value === "object") {
    if (value.type === "node") return cellValue(value.nodeLabel || value.snippet || value.selector);
    if (value.type === "source-location") return cellValue(value.url);
    if (value.type === "link") return cellValue(value.text || value.url);
    if ("url" in value) return cellValue(value.url);
    if ("value" in value) return cellValue(value.value);
    if ("text" in value) return cellValue(value.text);
  }
  return null;
}

function trimDetails(details: any): DetailsTable | null {
  if (!details) return null;
  let table = details;
  if (details.type === "list") {
    table = details.items?.find((i: any) => i?.type === "table" || i?.type === "opportunity");
  }
  if (!table || (table.type !== "table" && table.type !== "opportunity")) return null;

  const headings = (table.headings ?? [])
    .filter((h: any) => h?.key)
    .map((h: any) => ({ key: h.key as string, label: (h.label ?? "") as string, valueType: (h.valueType ?? "text") as string }));
  if (headings.length === 0) return null;

  const allItems: any[] = table.items ?? [];
  const items = allItems.slice(0, MAX_DETAIL_ITEMS).map((item) => {
    const row: Record<string, string | number | null> = {};
    for (const h of headings) row[h.key] = cellValue(item[h.key]);
    return row;
  });
  if (items.length === 0) return null;
  return { headings, items, totalItems: allItems.length };
}

export function buildAnalysis(lr: any): Analysis {
  const categories = {} as Analysis["categories"];
  const usedAuditIds = new Set<string>();

  for (const key of CATEGORY_KEYS) {
    const c = lr.categories?.[key];
    const auditRefs = (c?.auditRefs ?? [])
      .filter((r: any) => r.group !== "hidden")
      .map((r: any) => ({ id: r.id, weight: r.weight ?? 0, group: r.group ?? null, acronym: r.acronym ?? null }));
    auditRefs.forEach((r: { id: string }) => usedAuditIds.add(r.id));
    categories[key] = { title: c?.title ?? key, score: c?.score ?? null, auditRefs };
  }

  const audits: Record<string, StoredAudit> = {};
  for (const id of usedAuditIds) {
    const a = lr.audits?.[id];
    if (!a) continue;
    audits[id] = {
      title: a.title ?? id,
      description: a.description ?? "",
      score: typeof a.score === "number" ? a.score : null,
      scoreDisplayMode: a.scoreDisplayMode ?? "informative",
      displayValue: a.displayValue ?? null,
      metricSavings: a.metricSavings ?? null,
      details: trimDetails(a.details),
    };
  }

  const groups: Analysis["groups"] = {};
  for (const [key, g] of Object.entries<any>(lr.categoryGroups ?? {})) {
    groups[key] = { title: g.title ?? key, description: g.description ?? null };
  }

  return {
    meta: {
      fetchTime: lr.fetchTime ?? new Date().toISOString(),
      lighthouseVersion: lr.lighthouseVersion ?? "",
      finalUrl: lr.finalDisplayedUrl ?? lr.finalUrl ?? "",
      formFactor: lr.configSettings?.formFactor ?? "",
    },
    categories,
    groups,
    audits,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function runPsi(url: string, strategy: Strategy, apiKey: string): Promise<PsiResult> {
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.searchParams.set("url", url);
  endpoint.searchParams.set("strategy", strategy);
  endpoint.searchParams.set("key", apiKey);
  // "pt" é o português do Brasil no Lighthouse; "pt-BR"/"pt_BR" são ignorados pela API.
  endpoint.searchParams.set("locale", "pt");
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
    analysis: buildAnalysis(data.lighthouseResult ?? {}),
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
