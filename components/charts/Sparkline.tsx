/** Micrográfico de tendência do período, sem eixos (o valor exato fica no card). */
export default function Sparkline({
  values,
  className = "text-text-strong-950",
  label,
}: {
  values: (number | null)[];
  className?: string;
  label?: string;
}) {
  const pts = values.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null);
  if (pts.length < 2) return null;
  const min = Math.min(...pts.map((p) => p.v));
  const max = Math.max(...pts.map((p) => p.v));
  const span = max - min || 1;
  const last = values.length - 1 || 1;
  const x = (i: number) => (i / last) * 100;
  const y = (v: number) => 26 - ((v - min) / span) * 22;
  const d = pts.map((p, k) => `${k ? "L" : "M"}${x(p.i).toFixed(2)},${y(p.v).toFixed(2)}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={`h-8 w-full ${className}`} role="img" aria-label={label ?? "Tendência no período"}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
