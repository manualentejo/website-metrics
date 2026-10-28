import Link from "next/link";
import type { ReactNode } from "react";
import { RiErrorWarningLine, RiLineChartLine, RiPlugLine } from "@remixicon/react";

const ICON = { empty: RiLineChartLine, setup: RiPlugLine, error: RiErrorWarningLine } as const;

/** Estado vazio de gráfico/painel: sem dados, integração não conectada ou erro ao carregar. */
export default function ChartEmptyState({
  kind = "empty",
  title,
  children,
  action,
  className = "h-56",
}: {
  kind?: keyof typeof ICON;
  title: string;
  children?: ReactNode;
  action?: { href: string; label: string };
  className?: string;
}) {
  const Icon = ICON[kind];
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-stroke-soft-200 px-6 py-4 text-center ${className}`}
    >
      <Icon className={`size-5 ${kind === "error" ? "text-error-base" : "text-text-soft-400"}`} aria-hidden />
      <p className="text-label-sm text-text-strong-950">{title}</p>
      {children && <p className="max-w-sm text-paragraph-xs text-text-sub-600">{children}</p>}
      {action && (
        <Link href={action.href} className="mt-1 text-label-xs text-text-strong-950 underline underline-offset-2">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function ChartSkeleton({ className = "h-56" }: { className?: string }) {
  return <div aria-busy="true" aria-label="Carregando" className={`animate-pulse rounded-xl bg-bg-weak-50 ${className}`} />;
}
