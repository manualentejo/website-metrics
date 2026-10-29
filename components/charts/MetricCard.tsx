import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import InfoTip from "@/components/ui/InfoTip";
import Sparkline from "./Sparkline";

const TONE = {
  neutral: { tile: "bg-bg-weak-50 text-text-sub-600", spark: "text-text-sub-600" },
  blue: { tile: "bg-information-lighter text-information-base", spark: "text-information-base" },
  green: { tile: "bg-success-lighter text-success-base", spark: "text-success-base" },
  purple: { tile: "bg-feature-lighter text-feature-base", spark: "text-feature-base" },
  orange: { tile: "bg-warning-lighter text-warning-base", spark: "text-warning-base" },
  red: { tile: "bg-error-lighter text-error-base", spark: "text-error-base" },
} as const;
export type MetricTone = keyof typeof TONE;

/**
 * Indicador do topo da Visão geral: ícone colorido, valor, variação e minigráfico.
 * Com `connected={false}` mostra "não conectado" no lugar de qualquer número.
 */
export default function MetricCard({
  label,
  value,
  trend,
  hint,
  spark,
  info,
  href,
  icon: Icon,
  tone = "neutral",
  connected = true,
  setupText,
}: {
  label: string;
  value?: ReactNode;
  trend?: ReactNode;
  hint?: ReactNode;
  spark?: (number | null)[];
  info: { title: string; text: string };
  href: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: MetricTone;
  connected?: boolean;
  setupText?: string;
}) {
  const t = TONE[tone];
  return (
    <div className="group relative flex min-w-0 items-start gap-3 rounded-2xl bg-bg-white-0 p-3.5 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition duration-200 focus-within:ring-stroke-sub-300 hover:ring-stroke-sub-300 sm:p-4">
      {Icon && (
        <span className={`flex size-10 flex-shrink-0 items-center justify-center rounded-xl ${t.tile}`}>
          <Icon className="size-5" aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <Link href={href} className="truncate text-label-sm text-text-sub-600 after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">
            {label}
          </Link>
          <span className="relative z-10 flex-shrink-0">
            <InfoTip title={info.title} text={info.text} />
          </span>
        </div>
        {connected ? (
          <div className="mt-1 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-title-h5 tabular-nums text-text-strong-950">{value ?? "—"}</p>
              <div className="mt-0.5 min-h-4">{trend ?? (hint && <span className="block truncate text-paragraph-xs text-text-sub-600">{hint}</span>)}</div>
            </div>
            {spark && (
              <div className="w-16 flex-shrink-0 sm:w-20">
                <Sparkline values={spark} className={t.spark} label={`${label}: tendência`} />
              </div>
            )}
          </div>
        ) : (
          <div className="mt-1">
            <p className="text-title-h5 text-text-soft-400">—</p>
            <p className="text-paragraph-xs text-text-sub-600">{setupText ?? "Não conectado"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
