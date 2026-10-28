import Link from "next/link";
import { RiArrowRightSLine, RiCheckboxCircleLine } from "@remixicon/react";
import Badge from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/format";
import type { Alert } from "@/lib/insights";

const SEVERITY = { critical: { label: "Crítico", tone: "destructive" }, warning: { label: "Atenção", tone: "warning" }, good: { label: "Melhorou", tone: "success" } } as const;

/**
 * Problemas prioritários de vários sites. Cada linha leva direto à aba do site em que o
 * problema aparece, com o dispositivo e a origem (?from=overview) preservados na URL.
 * "Estado" é "Aberto" enquanto o problema continua na última auditoria; ainda não há registro de correção manual.
 */
export default function IssueList({ issues, showSite = true }: { issues: Alert[]; showSite?: boolean }) {
  if (!issues.length)
    return (
      <div className="flex items-center gap-3 rounded-xl bg-bg-weak-50 px-4 py-6 text-paragraph-sm text-text-sub-600">
        <RiCheckboxCircleLine className="size-5 text-success-base" />
        Nenhum problema aberto nas últimas auditorias.
      </div>
    );
  return (
    <ul className="divide-y divide-stroke-soft-200">
      {issues.map((a, i) => {
        const sev = SEVERITY[a.severity];
        return (
          <li key={`${a.siteId}-${a.title}-${a.strategy}-${i}`}>
            <Link href={a.href} className="group flex items-center gap-3 px-1 py-3 transition duration-200 hover:bg-bg-weak-50 sm:px-2">
              <span className={`size-2 flex-shrink-0 rounded-full ${a.severity === "critical" ? "bg-error-base" : "bg-warning-base"}`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-label-sm text-text-strong-950">
                  {showSite && <>{a.siteName} · </>}
                  {a.title}
                </span>
                <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-paragraph-xs text-text-sub-600">
                  <span>{a.category}</span>
                  <span aria-hidden>·</span>
                  <span>Detectado em {formatDateTime(a.at).split(",")[0]}</span>
                  <span aria-hidden>·</span>
                  <span>Estado: aberto</span>
                </span>
              </span>
              <span className="hidden flex-shrink-0 sm:block">
                <Badge tone={sev.tone}>{sev.label}</Badge>
              </span>
              <span className="flex flex-shrink-0 items-center gap-0.5 text-label-xs text-text-sub-600 group-hover:text-text-strong-950">
                <span className="hidden md:inline">Ver análise</span>
                <RiArrowRightSLine className="size-4" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
