import Link from "next/link";
import type { ComponentType } from "react";
import { RiAlertFill, RiArrowRightLine, RiArrowRightUpLine, RiArrowRightDownLine, RiLightbulbFlashLine, RiSparklingLine } from "@remixicon/react";
import type { WeeklyInsight } from "@/lib/portfolio";
import ChartEmptyState from "@/components/charts/ChartEmptyState";

const META: Record<WeeklyInsight["key"], { icon: ComponentType<{ className?: string }>; tile: string }> = {
  improvement: { icon: RiArrowRightUpLine, tile: "bg-success-lighter text-success-base" },
  regression: { icon: RiArrowRightDownLine, tile: "bg-error-lighter text-error-base" },
  priority: { icon: RiAlertFill, tile: "bg-warning-lighter text-warning-base" },
  opportunity: { icon: RiLightbulbFlashLine, tile: "bg-information-lighter text-information-base" },
  next: { icon: RiArrowRightLine, tile: "bg-bg-white-0 text-text-strong-950" },
};

/**
 * Resumo da semana em cartões. Hoje é montado por regras a partir das notas e alertas (sem modelo de IA),
 * e cada cartão aponta para a métrica ou auditoria que o sustenta. Uma integração de IA entra via
 * `source="ai"` com o mesmo formato de `insights`, sem mudar o layout.
 */
export default function AIInsightsPanel({ insights, source = "rules", compact = false }: { insights: WeeklyInsight[]; source?: "rules" | "ai"; compact?: boolean }) {
  if (!insights.length)
    return (
      <ChartEmptyState title="Ainda sem dados para resumir" className="h-40">
        O resumo semanal aparece depois da primeira auditoria.
      </ChartEmptyState>
    );
  return (
    <div>
      <ul className={compact ? "grid gap-2" : "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"}>
        {insights.map((i) => {
          const m = META[i.key];
          const Icon = m.icon;
          const dark = i.key === "next";
          const body = (
            <>
              <span className="flex items-center gap-2.5">
                <span className={`flex size-8 flex-shrink-0 items-center justify-center rounded-lg ${m.tile}`}>
                  <Icon className="size-4" />
                </span>
                <span className={`text-label-xs uppercase tracking-wide ${dark ? "text-text-white-0 opacity-70" : "text-text-soft-400"}`}>{i.label}</span>
              </span>
              <span className={`mt-3 block text-paragraph-sm ${dark ? "text-text-white-0" : "text-text-strong-950"}`}>{i.text}</span>
              <span className={`mt-auto flex items-center justify-between gap-2 pt-3 text-paragraph-xs ${dark ? "text-text-white-0 opacity-70" : "text-text-sub-600"}`}>
                <span className="truncate">{i.evidence ? `Base: ${i.evidence}` : " "}</span>
                {i.href && (
                  <span className={`inline-flex flex-shrink-0 items-center gap-0.5 text-label-xs ${dark ? "text-text-white-0" : "text-text-strong-950"}`}>
                    Ver dados <RiArrowRightUpLine className="size-3.5" />
                  </span>
                )}
              </span>
            </>
          );
          const cls = `flex ${compact ? "p-3" : "min-h-[9rem] p-4"} flex-col rounded-xl ${
            dark ? "bg-bg-strong-950" : "bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200"
          } ${i.href ? "transition duration-200 hover:ring-stroke-sub-300" : ""}`;
          return (
            <li key={i.key} className={!compact && i.key === "next" ? "sm:col-span-2 xl:col-span-1" : ""}>
              {i.href ? (
                <Link href={i.href} className={`${cls} h-full ${dark ? "hover:opacity-95" : "hover:bg-bg-weak-50"}`}>{body}</Link>
              ) : (
                <div className={`${cls} h-full`}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex items-center gap-1.5 text-paragraph-xs text-text-soft-400">
        <RiSparklingLine className="size-3.5" />
        {source === "ai"
          ? "Gerado por IA a partir dos dados acima."
          : "Resumo automático por regras, calculado só com os dados do painel. Uma análise por IA pode ser ligada aqui depois."}
      </p>
    </div>
  );
}
