import type { Analysis } from "@/lib/analysis";
import { auditStatus } from "@/lib/analysis";
import InfoTip from "@/components/ui/InfoTip";
import { StatusIcon } from "./AuditRow";

const METRIC_IDS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
];

const VALUE_COLOR = {
  fail: "text-destructive",
  average: "text-warning",
  pass: "text-success",
  info: "text-foreground/80",
  manual: "text-foreground/80",
  na: "text-foreground/80",
};

export default function MetricsPanel({ analysis }: { analysis: Analysis }) {
  const metrics = METRIC_IDS.map((id) => ({ id, audit: analysis.audits[id] })).filter((m) => m.audit);
  if (metrics.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
      {metrics.map(({ id, audit }) => {
        const status = auditStatus(audit);
        const ref = analysis.categories.performance.auditRefs.find((r) => r.id === id);
        return (
          <div key={id} className="flex gap-3 bg-card px-6 py-4">
            <span className="mt-1.5">
              <StatusIcon status={status} />
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-sm text-foreground/80">
                {audit.title}
                {ref?.acronym && <span className="text-xs text-muted-foreground">({ref.acronym})</span>}
                <InfoTip term={id} align="start" />
              </p>
              <p className={`mt-0.5 text-2xl font-semibold tracking-tight ${VALUE_COLOR[status]}`}>
                {audit.displayValue ?? "—"}
              </p>
            </div>
          </div>
        );
      })}
      {metrics.length % 2 === 1 && <div className="hidden bg-card sm:block" />}
    </div>
  );
}
