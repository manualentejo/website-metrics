import Link from "next/link";
import { RiArrowRightUpLine, RiSparklingLine } from "@remixicon/react";
import type { WeeklyInsight } from "@/lib/portfolio";
import ChartEmptyState from "@/components/charts/ChartEmptyState";

/**
 * Resumo da semana. Hoje é montado por regras a partir das notas e alertas (sem modelo de IA),
 * e cada frase aponta para a métrica ou auditoria que a sustenta. Quando houver uma integração
 * de IA, ela entra via `source="ai"` com o mesmo formato de `insights`, sem mudar o layout.
 */
export default function AIInsightsPanel({
  insights,
  source = "rules",
}: {
  insights: WeeklyInsight[];
  source?: "rules" | "ai";
}) {
  if (!insights.length)
    return (
      <ChartEmptyState title="Ainda sem dados para resumir" className="h-40">
        O resumo semanal aparece depois da primeira auditoria.
      </ChartEmptyState>
    );
  return (
    <div>
      <ul className="divide-y divide-stroke-soft-200">
        {insights.map((i) => (
          <li key={i.key} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <p className="text-label-xs uppercase tracking-wide text-text-soft-400">{i.label}</p>
            <div className="min-w-0">
              <p className="text-paragraph-sm text-text-strong-950">{i.text}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 text-paragraph-xs text-text-sub-600">
                {i.evidence && <span>Base: {i.evidence}</span>}
                {i.href && (
                  <Link href={i.href} className="inline-flex items-center gap-0.5 text-label-xs text-text-strong-950 underline underline-offset-2">
                    Ver dados <RiArrowRightUpLine className="size-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 flex items-center gap-1.5 text-paragraph-xs text-text-soft-400">
        <RiSparklingLine className="size-3.5" />
        {source === "ai"
          ? "Gerado por IA a partir dos dados acima."
          : "Resumo automático por regras, calculado só com os dados do painel. Uma análise por IA pode ser ligada aqui depois."}
      </p>
    </div>
  );
}
