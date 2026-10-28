import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-card text-card-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  action,
  info,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  info?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-5">
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          {title}
          {info}
        </h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
