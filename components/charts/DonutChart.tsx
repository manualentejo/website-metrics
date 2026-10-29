const COLOR = { success: "stroke-success-base", warning: "stroke-warning-base", error: "stroke-error-base", info: "stroke-information-base", feature: "stroke-feature-base" } as const;
const BG = { success: "bg-success-base", warning: "bg-warning-base", error: "bg-error-base", info: "bg-information-base", feature: "bg-feature-base" } as const;

/** Rosca com total no centro e legenda ao lado. Mostra quantos itens caem em cada categoria. */
export default function DonutChart({
  slices,
  center,
  centerLabel,
  size = 132,
}: {
  slices: { label: string; value: number; tone: keyof typeof COLOR }[];
  center: string;
  centerLabel: string;
  size?: number;
}) {
  const total = slices.reduce((a, b) => a + b.value, 0);
  const r = 46;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 120 120" className="-rotate-90" role="img" aria-label={slices.map((s) => `${s.label}: ${s.value}`).join(", ")}>
          <circle cx="60" cy="60" r={r} fill="none" strokeWidth="14" className="stroke-bg-weak-50" />
          {total > 0 &&
            slices.map((s) => {
              const len = (s.value / total) * c;
              const el = (
                <circle
                  key={s.label}
                  cx="60"
                  cy="60"
                  r={r}
                  fill="none"
                  strokeWidth="14"
                  strokeLinecap="butt"
                  strokeDasharray={`${Math.max(0, len - (s.value && slices.filter((x) => x.value).length > 1 ? 2 : 0))} ${c}`}
                  strokeDashoffset={-offset}
                  className={COLOR[s.tone]}
                />
              );
              offset += len;
              return s.value ? el : null;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-title-h5 tabular-nums text-text-strong-950">{center}</span>
          <span className="text-paragraph-xs text-text-sub-600">{centerLabel}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-2 text-paragraph-sm">
            <span className="flex min-w-0 items-center gap-2 text-text-sub-600">
              <span className={`size-2.5 flex-shrink-0 rounded-full ${BG[s.tone]}`} />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="tabular-nums text-label-sm text-text-strong-950">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
