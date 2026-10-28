const BG = { success: "bg-success-base", warning: "bg-warning-base", error: "bg-error-base" } as const;

/** Quantos sites caem em cada faixa de nota (barra empilhada + legenda com contagem). */
export default function HealthDistributionChart({
  buckets,
}: {
  buckets: { label: string; tone: keyof typeof BG; count: number }[];
}) {
  const total = buckets.reduce((a, b) => a + b.count, 0);
  if (!total) return null;
  return (
    <div>
      <div
        role="img"
        aria-label={buckets.map((b) => `${b.label}: ${b.count}`).join(", ")}
        className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full"
      >
        {buckets.map((b) =>
          b.count ? <span key={b.label} className={BG[b.tone]} style={{ width: `${(b.count / total) * 100}%` }} /> : null
        )}
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {buckets.map((b) => (
          <li key={b.label} className="min-w-0">
            <p className="flex items-center gap-1.5 text-paragraph-xs text-text-sub-600">
              <span className={`size-2 flex-shrink-0 rounded-full ${BG[b.tone]}`} />
              <span className="truncate">{b.label}</span>
            </p>
            <p className="mt-0.5 text-label-md tabular-nums text-text-strong-950">{b.count}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
