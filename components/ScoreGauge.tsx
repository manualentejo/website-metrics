function colorFor(score: number | null) {
  if (score === null) return { stroke: "#d1d1d1", text: "text-text-soft-400" };
  if (score >= 90) return { stroke: "#1fc16b", text: "text-text-strong-950" };
  if (score >= 50) return { stroke: "#ff8447", text: "text-text-strong-950" };
  return { stroke: "#fb3748", text: "text-text-strong-950" };
}

// Anel de nota. O número escala com o tamanho do anel para nunca encostar na borda.
export default function ScoreGauge({
  score,
  label,
  size = 84,
}: {
  score: number | null;
  label: string;
  size?: number;
}) {
  const { stroke, text } = colorFor(score);
  const sw = size <= 44 ? 3 : 5;
  const radius = (size - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = score === null ? 0 : (score / 100) * circumference;
  const fontSize = Math.round(size * (size <= 44 ? 0.32 : 0.3));

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#ebebeb" strokeWidth={sw} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <div
          className={`absolute inset-0 flex items-center justify-center font-medium tabular-nums ${text}`}
          style={{ fontSize }}
        >
          {score === null ? "—" : Math.round(score)}
        </div>
      </div>
      {label && <span className="text-center text-paragraph-sm text-text-sub-600">{label}</span>}
    </div>
  );
}
