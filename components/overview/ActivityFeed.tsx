import Link from "next/link";
import { RiAddLine, RiAlertFill, RiRadarLine } from "@remixicon/react";
import type { ActivityItem } from "@/lib/portfolio";

const META = {
  audit: { icon: RiRadarLine, tile: "bg-bg-weak-50 text-text-sub-600" },
  issue: { icon: RiAlertFill, tile: "bg-warning-lighter text-warning-base" },
  site: { icon: RiAddLine, tile: "bg-success-lighter text-success-base" },
} as const;

const TZ = "America/Sao_Paulo";
const dayLabel = (d: Date) => new Date(d).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "long", timeZone: TZ });
const time = (d: Date) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

/** Linha do tempo agrupada por dia, só com eventos que existem no banco: auditorias, alertas e sites adicionados. */
export default function ActivityFeed({ items, showSite = true }: { items: ActivityItem[]; showSite?: boolean }) {
  if (!items.length) return <p className="py-6 text-center text-paragraph-sm text-text-sub-600">Nenhuma atividade registrada ainda.</p>;

  const groups: { label: string; items: ActivityItem[] }[] = [];
  for (const it of items) {
    const label = dayLabel(it.at);
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(it);
    else groups.push({ label, items: [it] });
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.label}>
          <h4 className="mb-2 text-label-xs uppercase tracking-wide text-text-soft-400">{g.label}</h4>
          <ol className="relative space-y-1 before:absolute before:bottom-3 before:left-[1.125rem] before:top-3 before:w-px before:bg-stroke-soft-200">
            {g.items.map((it) => {
              const m = META[it.kind];
              const Icon = m.icon;
              return (
                <li key={it.id} className="relative">
                  <Link href={it.href} className="flex items-start gap-3 rounded-xl p-1.5 transition duration-200 hover:bg-bg-weak-50">
                    <span className={`relative z-[1] flex size-8 flex-shrink-0 items-center justify-center rounded-full ring-4 ring-bg-white-0 ${m.tile}`}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 pt-0.5">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-label-sm text-text-strong-950">{it.title}</span>
                        <time dateTime={new Date(it.at).toISOString()} className="flex-shrink-0 text-paragraph-xs tabular-nums text-text-soft-400">
                          {time(it.at)}
                        </time>
                      </span>
                      <span className="block truncate text-paragraph-xs text-text-sub-600">
                        {showSite && <span className="text-text-strong-950">{it.siteName}</span>}
                        {showSite && " · "}
                        {it.detail}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
