function colorFor(score: number | null) {
  if (score === null) return { stroke: "#d1d5db", text: "text-slate-400", bg: "#f3f4f6" };
  if (score >= 90) return { stroke: "#16a34a", text: "text-emerald-600", bg: "#ecfdf5" };
  if (score >= 50) return { stroke: "#d97706", text: "text-amber-600", bg: "#fffbeb" };
  return { stroke: "#dc2626", text: "text-rose-600", bg: "#fef2f2" };
}

export default function ScoreGauge({
  score,
  label,
  size = 84,
}: {
  score: number | null;
  label: string;
  size?: number;
}) {
  const { stroke, text, bg } = colorFor(score);
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score === null ? 0 : (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill={bg} stroke="#e5e7eb" strokeWidth={6} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={6}
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-lg font-semibold ${text}`}>
          {score === null ? "—" : Math.round(score)}
        </div>
      </div>
      {label && <span className="text-sm text-slate-600 text-center">{label}</span>}
    </div>
  );
}
