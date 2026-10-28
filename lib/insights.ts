import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { sites, reports, snapshots } from "@/db/schema";
import { auditStatus } from "@/lib/analysis";
import { AUDIT_PLAIN } from "@/lib/glossary";
import { canViewSite, getAccessibleSiteIds, type Viewer } from "@/lib/access";

export type Severity = "critical" | "warning" | "good";

export interface Alert {
  siteId: string;
  siteName: string;
  strategy: "mobile" | "desktop";
  severity: Severity;
  title: string;
  detail: string;
  at: Date;
}

const CATEGORIES = [
  { key: "performanceScore", label: "Desempenho" },
  { key: "accessibilityScore", label: "Acessibilidade" },
  { key: "bestPracticesScore", label: "Boas práticas" },
  { key: "seoScore", label: "SEO" },
] as const;

export async function visibleSites(viewer: Viewer) {
  const accessible = viewer.owner ? new Set<string>() : await getAccessibleSiteIds(viewer.email);
  const all = await db.select().from(sites).orderBy(asc(sites.sortOrder), asc(sites.createdAt));
  return all.filter((s) => canViewSite(viewer, s, accessible, s.id));
}

/** Todas as análises registradas dos sites visíveis, da mais recente para a mais antiga. */
export async function loadReportLog(viewer: Viewer, limit = 200) {
  const visible = await visibleSites(viewer);
  if (!visible.length) return { visible, log: [] };
  const rows = await db
    .select()
    .from(reports)
    .where(and(inArray(reports.siteId, visible.map((s) => s.id)), isNull(reports.error)))
    .orderBy(desc(reports.ranAt))
    .limit(limit);
  const byId = new Map(visible.map((s) => [s.id, s]));
  return { visible, log: rows.map((r) => ({ ...r, site: byId.get(r.siteId)! })) };
}

/** Alertas calculados comparando a análise mais recente com a anterior de cada site/dispositivo. */
export async function loadAlerts(viewer: Viewer): Promise<Alert[]> {
  const { visible, log } = await loadReportLog(viewer, 600);
  const alerts: Alert[] = [];

  for (const site of visible) {
    for (const strategy of ["mobile", "desktop"] as const) {
      const [now, before] = log.filter((r) => r.siteId === site.id && r.strategy === strategy);
      if (!now) continue;
      const base = { siteId: site.id, siteName: site.name, strategy, at: now.ranAt };
      const device = strategy === "mobile" ? "celular" : "computador";

      for (const c of CATEGORIES) {
        const cur = now[c.key];
        const prev = before?.[c.key];
        if (cur === null) continue;
        if (typeof prev === "number" && cur - prev <= -5) {
          alerts.push({
            ...base,
            severity: prev - cur >= 15 ? "critical" : "warning",
            title: `${c.label} caiu ${Math.round(prev - cur)} pontos`,
            detail: `De ${Math.round(prev)} para ${Math.round(cur)} no ${device}.`,
          });
        } else if (typeof prev === "number" && cur - prev >= 5) {
          alerts.push({
            ...base,
            severity: "good",
            title: `${c.label} subiu ${Math.round(cur - prev)} pontos`,
            detail: `De ${Math.round(prev)} para ${Math.round(cur)} no ${device}.`,
          });
        }
        if (cur < 50) {
          alerts.push({
            ...base,
            severity: "critical",
            title: `${c.label} abaixo de 50`,
            detail: `Nota ${Math.round(cur)} no ${device}. Veja o que corrigir na análise do site.`,
          });
        }
      }
      if (now.lcpMs !== null && now.lcpMs > 4000) {
        alerts.push({
          ...base,
          severity: "warning",
          title: "Carregamento do conteúdo principal lento (LCP)",
          detail: `${(now.lcpMs / 1000).toFixed(1)} s no ${device}; o ideal é abaixo de 2,5 s.`,
        });
      }
    }
  }

  const rank: Record<Severity, number> = { critical: 0, warning: 1, good: 2 };
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity] || b.at.getTime() - a.at.getTime());
}

export interface FixItem {
  siteId: string;
  siteName: string;
  auditId: string;
  title: string;
  displayValue: string | null;
  status: "fail" | "average";
  impact: number; // peso da auditoria × quanto falta para a nota máxima
  plain: string | null;
  savingsMs: number;
}

/** Fila de correções: auditorias de Desempenho, SEO etc. reprovadas, por impacto, no celular. */
export async function loadFixQueue(viewer: Viewer): Promise<FixItem[]> {
  const visible = await visibleSites(viewer);
  if (!visible.length) return [];
  const snaps = await db
    .select()
    .from(snapshots)
    .where(and(inArray(snapshots.siteId, visible.map((s) => s.id)), eq(snapshots.strategy, "desktop")));

  const items: FixItem[] = [];
  for (const snap of snaps) {
    const a = snap.analysis;
    if (!a) continue;
    const name = visible.find((s) => s.id === snap.siteId)?.name ?? "";
    const weights = new Map<string, number>();
    for (const cat of Object.values(a.categories)) for (const ref of cat.auditRefs) weights.set(ref.id, Math.max(ref.weight, weights.get(ref.id) ?? 0));

    for (const [id, audit] of Object.entries(a.audits)) {
      const status = auditStatus(audit);
      if (status !== "fail" && status !== "average") continue;
      const weight = weights.get(id) ?? 0;
      const savingsMs = Math.max(0, ...Object.values(audit.metricSavings ?? {}).filter((v) => typeof v === "number"));
      const impact = weight * (1 - (audit.score ?? 0)) + savingsMs / 1000;
      if (impact <= 0) continue;
      items.push({
        siteId: snap.siteId,
        siteName: name,
        auditId: id,
        title: audit.title,
        displayValue: audit.displayValue,
        status,
        impact,
        plain: AUDIT_PLAIN[id] ?? null,
        savingsMs,
      });
    }
  }
  return items.sort((x, y) => y.impact - x.impact);
}
