// Formato compacto da análise do Lighthouse que guardamos por site/estratégia
// (só a mais recente), com o suficiente para reproduzir a página do PageSpeed.

export type CategoryKey = "performance" | "accessibility" | "best-practices" | "seo";

export const CATEGORY_KEYS: CategoryKey[] = ["performance", "accessibility", "best-practices", "seo"];

export interface DetailsTable {
  headings: { key: string; label: string; valueType: string }[];
  items: Record<string, string | number | null>[];
  totalItems: number;
}

export interface StoredAudit {
  title: string;
  description: string;
  score: number | null;
  scoreDisplayMode: string;
  displayValue: string | null;
  metricSavings: Record<string, number> | null;
  details: DetailsTable | null;
}

export interface StoredCategory {
  title: string;
  score: number | null;
  auditRefs: { id: string; weight: number; group: string | null; acronym: string | null }[];
}

export interface Analysis {
  meta: {
    fetchTime: string;
    lighthouseVersion: string;
    finalUrl: string;
    formFactor: string;
  };
  categories: Record<CategoryKey, StoredCategory>;
  groups: Record<string, { title: string; description: string | null }>;
  audits: Record<string, StoredAudit>;
}

export type AuditStatus = "fail" | "average" | "pass" | "info" | "manual" | "na";

export function auditStatus(audit: StoredAudit): AuditStatus {
  switch (audit.scoreDisplayMode) {
    case "manual":
      return "manual";
    case "notApplicable":
      return "na";
    case "informative":
      return "info";
  }
  if (audit.score === null) return "info";
  if (audit.score >= 0.9) return "pass";
  if (audit.score >= 0.5) return "average";
  return "fail";
}
