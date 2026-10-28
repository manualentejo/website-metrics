import { RiArrowRightUpLine, RiArrowRightDownLine, RiSubtractLine } from "@remixicon/react";
import { fmtDelta, type Unit } from "./format";

/**
 * Variação contra o período anterior. `goodWhen` diz se subir é bom (notas, visitas)
 * ou ruim (problemas críticos), para a cor nunca contar a história errada.
 */
export default function TrendIndicator({
  current,
  previous,
  delta,
  unit = "score",
  goodWhen = "up",
  suffix,
}: {
  current: number | null;
  previous?: number | null;
  delta?: number | null;
  unit?: Unit;
  goodWhen?: "up" | "down";
  suffix?: string;
}) {
  const d = delta ?? (current !== null && previous != null ? current - previous : null);
  if (d === null || current === null) return <span className="text-paragraph-xs text-text-soft-400">sem comparação</span>;
  const flat = Math.abs(d) < 0.05;
  const good = goodWhen === "up" ? d > 0 : d < 0;
  const tone = flat ? "text-text-sub-600" : good ? "text-success-base" : "text-error-base";
  const Icon = flat ? RiSubtractLine : d > 0 ? RiArrowRightUpLine : RiArrowRightDownLine;
  const text = fmtDelta(current, previous ?? current - d, unit) ?? "";
  return (
    <span className={`inline-flex items-center gap-0.5 text-label-xs tabular-nums ${tone}`}>
      <Icon className="size-3.5" aria-hidden />
      {flat ? "estável" : text}
      <span className="sr-only">{flat ? "" : good ? " (melhora)" : " (piora)"}</span>
      {suffix && <span className="ml-1 font-normal text-text-soft-400">{suffix}</span>}
    </span>
  );
}
