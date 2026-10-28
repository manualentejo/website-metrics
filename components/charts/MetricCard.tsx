import Link from "next/link";
import type { ReactNode } from "react";
import InfoTip from "@/components/ui/InfoTip";
import Sparkline from "./Sparkline";

/**
 * Indicador do topo do Overview. Com `connected={false}` mostra o estado "não conectado"
 * em vez de qualquer número: o card nunca simula uma integração que não existe.
 */
export default function MetricCard({
  label,
  value,
  trend,
  hint,
  spark,
  info,
  href,
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
  connected?: boolean;
  setupText?: string;
}) {
  return (
    <div className="group relative flex min-w-0 flex-col rounded-2xl bg-bg-white-0 p-4 ring-1 ring-inset ring-stroke-soft-200 transition duration-200 focus-within:ring-stroke-sub-300 hover:ring-stroke-sub-300">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={href}
          className="truncate text-label-xs uppercase tracking-wide text-text-soft-400 after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none"
        >
          {label}
        </Link>
        <span className="relative z-10">
          <InfoTip title={info.title} text={info.text} />
        </span>
      </div>
      {connected ? (
        <>
          <p className="mt-2 text-title-h4 tabular-nums text-text-strong-950">{value ?? "—"}</p>
          <div className="mt-1 min-h-5">{trend}</div>
          <div className="mt-2 min-h-8">{spark && <Sparkline values={spark} label={`${label}: tendência no período`} />}</div>
          {hint && <p className="mt-1 truncate text-paragraph-xs text-text-sub-600">{hint}</p>}
        </>
      ) : (
        <div className="mt-2 flex flex-1 flex-col">
          <p className="text-title-h4 text-text-soft-400">—</p>
          <p className="mt-1 text-label-xs text-text-sub-600">Não conectado</p>
          <p className="mt-2 text-paragraph-xs text-text-sub-600">{setupText}</p>
        </div>
      )}
    </div>
  );
}
