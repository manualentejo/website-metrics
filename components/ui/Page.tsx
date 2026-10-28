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
    <div className={`mx-auto space-y-5 px-8 py-6 ${width}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </div>
  );
}

// Controle segmentado (filtros e alternâncias): um bloco só, canto 6px.
export function Segmented({
  items,
  label,
}: {
  items: { href: string; label: string; active: boolean }[];
  label: string;
}) {
  return (
    <nav aria-label={label} className="inline-flex h-8 items-center rounded-md border border-border bg-secondary p-0.5">
      {items.map((i) => (
        <Link
          key={i.label}
          href={i.href}
          aria-current={i.active ? "page" : undefined}
          className={`inline-flex h-7 items-center rounded px-2.5 text-xs font-medium transition-colors ${
            i.active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
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
    <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-[13px] text-muted-foreground">{children}</p>}
    </div>
  );
}
