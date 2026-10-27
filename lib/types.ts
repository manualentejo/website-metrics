export type Status = "no_ar" | "em_andamento";
export type Strategy = "mobile" | "desktop";

export interface ReportRow {
  id: string;
  siteId: string;
  strategy: string;
  ranAt: string | Date;
  performanceScore: number | null;
  accessibilityScore: number | null;
  bestPracticesScore: number | null;
  seoScore: number | null;
  fcpMs: number | null;
  lcpMs: number | null;
  tbtMs: number | null;
  cls: number | null;
  speedIndexMs: number | null;
  failedSeoAudits: { id: string; title: string; weight: number; score: number | null }[] | null;
  error: string | null;
}

export interface SiteRow {
  id: string;
  name: string;
  url: string;
  status: Status;
  sortOrder: number;
  createdAt: string | Date;
  reports: ReportRow[];
}
