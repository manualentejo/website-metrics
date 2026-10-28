/** Barras horizontais comparando entidades na mesma unidade (%). A primeira é destacada. */
export default function ComparisonChart({
  items,
  unit = "%",
  max = 100,
}: {
  items: { label: string; value: number; sub?: string }[];
  unit?: string;
  max?: number;
}) {
  if (!items.length) return null;
  return (
    <ul className="space-y-3">
      {items.map((it, i) => (
        <li key={it.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-paragraph-sm">
            <span className={`truncate ${i === 0 ? "text-label-sm text-text-strong-950" : "text-text-sub-600"}`}>{it.label}</span>
            <span className="flex-shrink-0 tabular-nums text-label-sm text-text-strong-950">
              {Math.round(it.value)}
              {unit}
              {it.sub && <span className="ml-1.5 font-normal text-text-soft-400">{it.sub}</span>}
            </span>
          </div>
          <div
            role="img"
            aria-label={`${it.label}: ${Math.round(it.value)}${unit}`}
            className="h-2 overflow-hidden rounded-full bg-bg-weak-50"
          >
            <div
              className={`h-full rounded-full ${i === 0 ? "bg-bg-strong-950" : "bg-stroke-sub-300"}`}
              style={{ width: `${Math.max(2, Math.min(100, (it.value / max) * 100))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
