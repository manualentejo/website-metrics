import Link from "next/link";
import type { ReactNode } from "react";

// Cabeçalho + largura padrão de todas as páginas do painel.
export function Page({
  title,
  subtitle,
  actions,
  children,
  width = "max-w-6xl",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  return (
    <div className={`mx-auto space-y-6 px-8 py-8 ${width}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-title-h6 text-text-strong-950">{title}</h1>
          {subtitle && <p className="mt-1 text-paragraph-sm text-text-sub-600">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </div>
  );
}

// Controle segmentado do AlignUI (fundo cinza, item ativo branco com sombra), com links.
export function Segmented({
  items,
  label,
}: {
  items: { href: string; label: string; active: boolean }[];
  label: string;
}) {
  return (
    <nav aria-label={label} className="inline-flex items-center gap-1 rounded-10 bg-bg-weak-50 p-1">
      {items.map((i) => (
        <Link
          key={i.label}
          href={i.href}
          aria-current={i.active ? "page" : undefined}
          className={`inline-flex h-7 items-center whitespace-nowrap rounded-md px-3 text-label-sm transition duration-300 ${
            i.active ? "bg-bg-white-0 text-text-strong-950 shadow-toggle-switch" : "text-text-soft-400 hover:text-text-strong-950"
          }`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-stroke-soft-200 px-6 py-10 text-center">
      <p className="text-label-md text-text-strong-950">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-paragraph-sm text-text-sub-600">{children}</p>}
    </div>
  );
}
