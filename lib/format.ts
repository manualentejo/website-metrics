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

export function formatDateTime(iso: string | Date): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

export function scoreColor(score: number | null) {
  if (score === null) return "text-slate-400";
  if (score >= 90) return "text-emerald-600";
  if (score >= 50) return "text-amber-600";
  return "text-rose-600";
}
