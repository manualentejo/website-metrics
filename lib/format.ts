const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export function formatCell(value: string | number | null, valueType: string): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    switch (valueType) {
      case "bytes":
        return `${nf.format(value / 1024)} KiB`;
      case "ms":
      case "timespanMs":
        return `${nf.format(Math.round(value))} ms`;
      default:
        return nf.format(value);
    }
  }
  if (valueType === "url") return shortenUrl(value);
  return value;
}

export function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = `${u.pathname}${u.search}`;
    const short = path.length > 48 ? `${path.slice(0, 30)}…${path.slice(-14)}` : path;
    return `${u.hostname}${short === "/" ? "" : short}`;
  } catch {
    return url.length > 60 ? `${url.slice(0, 57)}…` : url;
  }
}

const TZ = "America/Sao_Paulo";
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });

/** "hoje, 10:02", "ontem, 10:02" ou "6 nov, 10:02" (com o ano só quando não é o atual). */
export function formatDateTime(iso: string | Date): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
  const k = dayKey(d);
  if (k === dayKey(now)) return `hoje, ${time}`;
  if (k === dayKey(new Date(now.getTime() - 86400000))) return `ontem, ${time}`;
  return `${formatDay(d)}, ${time}`;
}

/** "6 nov" (ou "6 nov 2025" se for de outro ano). */
export function formatDay(iso: string | Date): string {
  const d = new Date(iso);
  const sameYear = dayKey(d).slice(0, 4) === dayKey(new Date()).slice(0, 4);
  return d
    .toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: sameYear ? undefined : "numeric", timeZone: TZ })
    .replace(/\./g, "")
    .replace(/ de /g, " ");
}

export function scoreColor(score: number | null) {
  if (score === null) return "text-slate-400";
  if (score >= 90) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-rose-600";
}
