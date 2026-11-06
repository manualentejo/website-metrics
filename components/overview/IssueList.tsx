import Link from "next/link";
import { RiAlertFill, RiArrowDownSLine, RiArrowRightLine, RiCheckboxCircleFill, RiErrorWarningFill } from "@remixicon/react";
import Badge from "@/components/ui/Badge";
import SiteIcon from "@/components/SiteIcon";
import type { Alert, Severity } from "@/lib/insights";

const SEVERITY = {
  critical: { label: "Crítico", tone: "destructive", icon: RiErrorWarningFill, tile: "bg-error-lighter text-error-base" },
  warning: { label: "Atenção", tone: "warning", icon: RiAlertFill, tile: "bg-warning-lighter text-warning-base" },
  good: { label: "Melhorou", tone: "success", icon: RiCheckboxCircleFill, tile: "bg-success-lighter text-success-base" },
} as const;

const day = (d: Date) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }).replace(".", "");
const rank: Record<Severity, number> = { critical: 0, warning: 1, good: 2 };

interface SiteIssue {
  key: string;
  first: Alert;
  devices: string[];
}

/** Junta o mesmo problema medido no celular e no computador do mesmo site. */
function bySite(issues: Alert[]): SiteIssue[] {
  const map = new Map<string, SiteIssue>();
  for (const a of issues) {
    const key = `${a.siteId}|${a.title}`;
    const dev = a.strategy === "mobile" ? "Celular" : "Computador";
    const g = map.get(key);
    if (!g) map.set(key, { key, first: a, devices: [dev] });
    else if (!g.devices.includes(dev)) g.devices.push(dev);
  }
  return [...map.values()];
}

const AGG: Record<Alert["kind"], (n: number) => string> = {
  lcp: (n) => `LCP lento em ${n} sites`,
  low: (n) => `Notas abaixo de 50 em ${n} sites`,
  drop: (n) => `Queda de nota em ${n} sites`,
  rise: (n) => `Melhora em ${n} sites`,
};

type Row = { type: "one"; item: SiteIssue } | { type: "many"; kind: Alert["kind"]; items: SiteIssue[]; severity: Severity };

/** Vários sites com o mesmo tipo de problema viram uma linha só ("LCP lento em 5 sites"), que abre a lista. */
function toRows(issues: Alert[]): Row[] {
  const items = bySite(issues);
  const byKind = new Map<Alert["kind"], SiteIssue[]>();
  for (const it of items) byKind.set(it.first.kind, [...(byKind.get(it.first.kind) ?? []), it]);
  const rows: Row[] = [];
  for (const [kind, list] of byKind) {
    const sites = new Set(list.map((i) => i.first.siteId));
    if (sites.size >= 2) {
      const severity = list.reduce<Severity>((w, i) => (rank[i.first.severity] < rank[w] ? i.first.severity : w), "good");
      rows.push({ type: "many", kind, items: list, severity });
    } else for (const item of list) rows.push({ type: "one", item });
  }
  const sev = (r: Row) => (r.type === "one" ? r.item.first.severity : r.severity);
  return rows.sort((a, b) => rank[sev(a)] - rank[sev(b)] || (b.type === "many" ? b.items.length : 1) - (a.type === "many" ? a.items.length : 1));
}

function SiteChip({ a }: { a: Alert }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-bg-weak-50 py-0.5 pl-1 pr-2 text-label-xs text-text-strong-950">
      <SiteIcon url={a.siteUrl} name={a.siteName} size={16} />
      {a.siteName}
    </span>
  );
}

const lcpText = (a: Alert) => (a.kind === "lcp" && a.value ? `${a.value.toFixed(1).replace(".", ",")} s` : null);

/**
 * Problemas prioritários de vários sites. Cada linha abre a aba do site em que o problema aparece
 * (dispositivo e origem preservados na URL). "Aberto" = ainda presente na última auditoria; o painel
 * ainda não registra correções manuais.
 */
export default function IssueList({ issues, showSite = true, dense = false }: { issues: Alert[]; showSite?: boolean; dense?: boolean }) {
  if (!issues.length)
    return (
      <div className="flex items-center gap-3 rounded-xl bg-success-lighter px-4 py-5 text-paragraph-sm text-text-strong-950">
        <RiCheckboxCircleFill className="size-5 text-success-base" />
        Nenhum problema aberto nas últimas auditorias.
      </div>
    );
  const rows = toRows(issues);
  const critical = rows.filter((r) => (r.type === "one" ? r.item.first.severity : r.severity) === "critical").length;
  const pad = dense ? "p-2.5" : "p-3 sm:gap-4 sm:p-4";
  const tileSize = dense ? "size-8" : "size-10";
  const card = "rounded-xl bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200 transition duration-200 hover:ring-stroke-sub-300";

  return (
    <div>
      {!dense && (
        <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-paragraph-xs text-text-sub-600">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-error-base" />{critical} crítico{critical === 1 ? "" : "s"}</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-warning-base" />{rows.length - critical} em atenção</span>
        </p>
      )}
      <ul className="grid gap-2">
        {rows.map((r) => {
          if (r.type === "one") {
            const { first: a, devices } = r.item;
            const sev = SEVERITY[a.severity];
            const Icon = sev.icon;
            const extra = lcpText(a);
            return (
              <li key={r.item.key}>
                <Link href={a.href} className={`group flex items-center gap-3 ${card} ${pad} hover:bg-bg-soft-200`}>
                  <span className={`flex flex-shrink-0 items-center justify-center rounded-xl ${tileSize} ${sev.tile}`}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-label-md text-text-strong-950 sm:truncate">
                      {a.title}
                      {extra && <span className="ml-1.5 text-error-base">{extra}</span>}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-paragraph-xs text-text-sub-600">
                      {showSite && <SiteChip a={a} />}
                      <span>{a.category}</span>
                      <span aria-hidden className="text-text-soft-400">•</span>
                      <span>{devices.join(" e ")}</span>
                      <span aria-hidden className="text-text-soft-400">•</span>
                      <span>Detectado em {day(a.at)}</span>
                    </span>
                  </span>
                  <span className={`hidden flex-shrink-0 flex-col items-end gap-1 ${dense ? "xl:flex" : "sm:flex"}`}>
                    <Badge tone={sev.tone}>{sev.label}</Badge>
                    <span className="text-paragraph-xs text-text-soft-400">Aberto</span>
                  </span>
                  <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg text-text-sub-600 transition duration-200 group-hover:bg-bg-strong-950 group-hover:text-text-white-0">
                    <RiArrowRightLine className="size-4" aria-hidden />
                    <span className="sr-only">Abrir análise</span>
                  </span>
                </Link>
              </li>
            );
          }
          const sev = SEVERITY[r.severity];
          const Icon = sev.icon;
          const siteCount = new Set(r.items.map((i) => i.first.siteId)).size;
          const shown = [...new Map(r.items.map((i) => [i.first.siteId, i.first])).values()].slice(0, 4);
          return (
            <li key={r.kind}>
              <details className={`group ${card}`}>
                <summary className={`flex cursor-pointer list-none items-center gap-3 ${pad}`}>
                  <span className={`flex flex-shrink-0 items-center justify-center rounded-xl ${tileSize} ${sev.tile}`}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-label-md text-text-strong-950 sm:truncate">{AGG[r.kind](siteCount)}</span>
                    <span className="mt-1 flex items-center gap-2 text-paragraph-xs text-text-sub-600">
                      <span className="flex -space-x-1.5">
                        {shown.map((a) => (
                          <span key={a.siteId} className="rounded-md ring-2 ring-bg-white-0">
                            <SiteIcon url={a.siteUrl} name={a.siteName} size={18} />
                          </span>
                        ))}
                      </span>
                      <span className="truncate">{shown.map((a) => a.siteName).join(", ")}{siteCount > shown.length ? ` e mais ${siteCount - shown.length}` : ""}</span>
                    </span>
                  </span>
                  <span className={`hidden flex-shrink-0 ${dense ? "xl:block" : "sm:block"}`}>
                    <Badge tone={sev.tone}>{sev.label}</Badge>
                  </span>
                  <RiArrowDownSLine className="size-5 flex-shrink-0 text-text-sub-600 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <ul className="divide-y divide-stroke-soft-200 border-t border-stroke-soft-200">
                  {r.items.map((i) => {
                    const a = i.first;
                    const extra = lcpText(a);
                    return (
                      <li key={i.key}>
                        <Link href={a.href} className="flex items-center gap-2.5 px-3 py-2 text-paragraph-sm hover:bg-bg-soft-200">
                          <SiteIcon url={a.siteUrl} name={a.siteName} size={18} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-text-strong-950">{a.siteName}</span>
                            <span className="block truncate text-paragraph-xs text-text-sub-600">
                              {r.kind === "lcp" ? "" : `${a.title} · `}
                              {extra ? `${extra} · ` : ""}
                              {i.devices.join(" e ")}
                            </span>
                          </span>
                          <RiArrowRightLine className="size-4 flex-shrink-0 text-text-sub-600" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
