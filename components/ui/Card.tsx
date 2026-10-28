import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-bg-white-0 text-text-strong-950 ring-1 ring-inset ring-stroke-soft-200 ${className}`}>
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
    <div className="flex items-start justify-between gap-4 px-5 pt-4">
      <div>
        <h3 className="flex items-center gap-1.5 text-label-md text-text-strong-950">
          {title}
          {info}
        </h3>
        {description && <p className="mt-0.5 text-paragraph-xs text-text-sub-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}
