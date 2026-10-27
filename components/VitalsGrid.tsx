import { vitalExplanations } from "@/lib/metricExplanations";

function formatMs(value: number | null | undefined) {
  if (typeof value !== "number") return "—";
  return `${(value / 1000).toFixed(2)}s`;
}

function formatCls(value: number | null | undefined) {
  if (typeof value !== "number") return "—";
  return value.toFixed(3);
}

export default function VitalsGrid({
  fcpMs,
  lcpMs,
  tbtMs,
  cls,
  speedIndexMs,
}: {
  fcpMs: number | null;
  lcpMs: number | null;
  tbtMs: number | null;
  cls: number | null;
  speedIndexMs: number | null;
}) {
  const vitals = [
    { key: "fcp", value: formatMs(fcpMs) },
    { key: "lcp", value: formatMs(lcpMs) },
    { key: "tbt", value: formatMs(tbtMs) },
    { key: "cls", value: formatCls(cls) },
    { key: "speedIndex", value: formatMs(speedIndexMs) },
  ];

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">Core Web Vitals</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {vitals.map((v) => {
          const info = vitalExplanations[v.key];
          return (
            <details key={v.key} className="group rounded-lg bg-slate-50 px-3 py-2 text-center">
              <summary className="cursor-pointer list-none">
                <div className="text-xs text-slate-500">{info.label.split(" — ")[0]}</div>
                <div className="text-sm font-semibold text-slate-800">{v.value}</div>
              </summary>
              <p className="mt-2 text-left text-xs leading-snug text-slate-500">
                {info.description} <span className="text-slate-400">({info.good})</span>
              </p>
            </details>
          );
        })}
      </div>
    </div>
  );
}
