import Link from "next/link";
import { RiAlertFill, RiArrowRightLine, RiCheckboxCircleFill, RiErrorWarningFill } from "@remixicon/react";
import Badge from "@/components/ui/Badge";
import type { Alert } from "@/lib/insights";

const SEVERITY = {
  critical: { label: "Crítico", tone: "destructive", icon: RiErrorWarningFill, tile: "bg-error-lighter text-error-base" },
  warning: { label: "Atenção", tone: "warning", icon: RiAlertFill, tile: "bg-warning-lighter text-warning-base" },
  good: { label: "Melhorou", tone: "success", icon: RiCheckboxCircleFill, tile: "bg-success-lighter text-success-base" },
} as const;

const day = (d: Date) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }).replace(".", "");

interface Group {
  key: string;
  first: Alert;
  devices: string[];
}

/** Junta o mesmo problema medido no celular e no computador numa linha só. */
function group(issues: Alert[]): Group[] {
  const map = new Map<string, Group>();
  for (const a of issues) {
    const key = `${a.siteId}|${a.title}`;
    const dev = a.strategy === "mobile" ? "Celular" : "Computador";
    const g = map.get(key);
    if (!g) map.set(key, { key, first: a, devices: [dev] });
    else if (!g.devices.includes(dev)) g.devices.push(dev);
  }
  return [...map.values()];
}

/**
 * Problemas prioritários de vários sites. Cada linha abre a aba do site em que o problema aparece
 * (dispositivo e origem preservados na URL). "Aberto" = ainda presente na última auditoria; o painel
 * ainda não registra correções manuais.
 */
export default function IssueList({ issues, showSite = true }: { issues: Alert[]; showSite?: boolean }) {
  if (!issues.length)
    return (
      <div className="flex items-center gap-3 rounded-xl bg-success-lighter px-4 py-5 text-paragraph-sm text-text-strong-950">
        <RiCheckboxCircleFill className="size-5 text-success-base" />
        Nenhum problema aberto nas últimas auditorias.
      </div>
    );
  const groups = group(issues);
  const critical = groups.filter((g) => g.first.severity === "critical").length;

  return (
    <div>
      <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-paragraph-xs text-text-sub-600">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-error-base" />{critical} crítico{critical === 1 ? "" : "s"}</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-warning-base" />{groups.length - critical} em atenção</span>
      </p>
      <ul className="grid gap-2">
        {groups.map(({ key, first: a, devices }) => {
          const sev = SEVERITY[a.severity];
          const Icon = sev.icon;
          return (
            <li key={key}>
              <Link
                href={a.href}
                className="group flex items-center gap-3 rounded-xl bg-bg-white-0 p-3 ring-1 ring-inset ring-stroke-soft-200 transition duration-200 hover:bg-bg-weak-50 hover:ring-stroke-sub-300 sm:gap-4 sm:p-4"
              >
                <span className={`flex size-10 flex-shrink-0 items-center justify-center rounded-xl ${sev.tile}`}>
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-label-md text-text-strong-950 sm:truncate">{a.title}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-paragraph-xs text-text-sub-600">
                    {showSite && (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-bg-weak-50 py-0.5 pl-0.5 pr-2 text-label-xs text-text-strong-950">
                        <span className="flex size-4 items-center justify-center rounded bg-bg-white-0 text-[10px] uppercase ring-1 ring-inset ring-stroke-soft-200">
                          {a.siteName.slice(0, 1)}
                        </span>
                        {a.siteName}
                      </span>
                    )}
                    <span>{a.category}</span>
                    <span aria-hidden className="text-text-soft-400">•</span>
                    <span>{devices.join(" e ")}</span>
                    <span aria-hidden className="text-text-soft-400">•</span>
                    <span>Detectado em {day(a.at)}</span>
                  </span>
                </span>
                <span className="hidden flex-shrink-0 flex-col items-end gap-1 sm:flex">
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
        })}
      </ul>
    </div>
  );
}
