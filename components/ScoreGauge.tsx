function colorFor(score: number | null) {
  if (score === null) return { stroke: "hsl(0 0% 80%)", text: "text-muted-foreground" };
  if (score >= 90) return { stroke: "hsl(152 55% 36%)", text: "text-foreground" };
  if (score >= 50) return { stroke: "hsl(36 90% 44%)", text: "text-foreground" };
  return { stroke: "hsl(0 68% 50%)", text: "text-foreground" };
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
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(0 0% 91%)" strokeWidth={sw} />
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
      {label && <span className="text-center text-[13px] text-muted-foreground">{label}</span>}
    </div>
  );
}
