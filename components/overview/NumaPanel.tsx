import Link from "next/link";
import { RiArrowRightLine, RiErrorWarningFill, RiSparklingLine } from "@remixicon/react";
import AIInsightsPanel from "./AIInsightsPanel";
import NumaSummary from "./NumaSummary";
import SiteIcon from "@/components/SiteIcon";
import type { Alert } from "@/lib/insights";
import type { WeeklyInsight } from "@/lib/portfolio";

/**
 * Bloco da Numa na Visão geral: problemas críticos em destaque no topo, o texto da Numa e os pontos
 * da semana (melhora, piora, oportunidade, próxima ação) com link para os dados.
 */
export default function NumaPanel({ insights, issues }: { insights: WeeklyInsight[]; issues: Alert[] }) {
  // Um destaque por site + problema (celular e computador juntos), os mais graves primeiro.
  const seen = new Set<string>();
  const critical = issues
    .filter((a) => a.severity === "critical")
    .filter((a) => {
      const k = `${a.siteId}|${a.title}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 2);

  return (
    <div className="space-y-3">
      {critical.length > 0 && (
        <ul className="space-y-2" aria-label="Problemas críticos">
          {critical.map((a) => (
            <li key={`${a.siteId}-${a.title}`}>
              <Link href={a.href} className="group flex items-start gap-2.5 rounded-xl bg-error-lighter p-3 ring-1 ring-inset ring-error-light transition hover:ring-error-base">
                <RiErrorWarningFill className="mt-0.5 size-5 flex-shrink-0 text-error-base" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-label-xs uppercase tracking-wide text-error-base">
                    Crítico
                    <span aria-hidden>·</span>
                    <SiteIcon url={a.siteUrl} name={a.siteName} size={14} />
                    <span className="normal-case tracking-normal text-text-strong-950">{a.siteName}</span>
                  </span>
                  <span className="mt-0.5 block text-label-sm text-text-strong-950">
                    {a.kind === "lcp" && a.value ? `Página demora ${a.value.toFixed(1).replace(".", ",")} s para mostrar o conteúdo principal (ideal: menos de 2,5 s)` : a.title}
                  </span>
                  <span className="mt-0.5 block text-paragraph-xs text-text-sub-600">{a.kind === "lcp" ? "LCP no " : ""}{a.strategy === "mobile" ? "celular" : "computador"} · {a.detail}</span>
                </span>
                <RiArrowRightLine className="mt-1 size-4 flex-shrink-0 text-error-base" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-label-xs uppercase tracking-wide text-text-soft-400">
          <RiSparklingLine className="size-3.5" /> Numa resume
        </p>
        <NumaSummary />
      </div>

      <AIInsightsPanel insights={critical.length ? insights.filter((i) => i.key !== "priority") : insights} compact source="rules" />

      <Link href="/chat" className="flex h-9 items-center justify-center gap-2 rounded-lg bg-bg-strong-950 text-label-sm text-text-white-0 transition hover:opacity-90">
        <RiSparklingLine className="size-4" />
        Falar com a Numa
      </Link>
    </div>
  );
}
