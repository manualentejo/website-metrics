import type { CSSProperties, ReactNode } from "react";

/** Balão do gráfico: data, valor e variação. Quem o usa define a posição. */
export default function ChartTooltip({
  title,
  rows,
  style,
}: {
  title: string;
  rows: { color?: string; label: string; value: ReactNode; sub?: ReactNode }[];
  style?: CSSProperties;
}) {
  return (
    <div
      role="tooltip"
      style={style}
      className="pointer-events-none absolute z-10 min-w-[11rem] rounded-xl bg-bg-white-0 p-3 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200"
    >
      <p className="mb-1.5 text-label-xs text-text-sub-600">{title}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4 text-paragraph-xs">
            <span className="flex items-center gap-1.5 text-text-sub-600">
              {r.color && <span className={`h-0.5 w-3 ${r.color}`} />}
              {r.label}
            </span>
            <span className="text-right">
              <span className="text-label-sm tabular-nums text-text-strong-950">{r.value}</span>
              {r.sub && <span className="block text-label-xs tabular-nums">{r.sub}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
