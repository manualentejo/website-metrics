export type Unit = "score" | "count";

export const fmtNumber = (v: number, unit: Unit = "count") =>
  unit === "score" ? v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : Math.round(v).toLocaleString("pt-BR");

export const fmtDay = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");

/** Variação legível: pontos para notas, porcentagem para contagens. */
export function fmtDelta(cur: number, prev: number | null | undefined, unit: Unit): string | null {
  if (prev === null || prev === undefined) return null;
  const d = cur - prev;
  const sign = d > 0 ? "+" : d < 0 ? "−" : "";
  if (unit === "score") return `${sign}${Math.abs(d).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} pts`;
  if (prev === 0) return d === 0 ? "0%" : "novo";
  return `${sign}${Math.abs((d / prev) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;
}
