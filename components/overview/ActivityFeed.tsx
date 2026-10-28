import Link from "next/link";
import { RiAddCircleLine, RiAlertLine, RiRadarLine } from "@remixicon/react";
import { formatDateTime } from "@/lib/format";
import type { ActivityItem } from "@/lib/portfolio";

const ICON = { audit: RiRadarLine, issue: RiAlertLine, site: RiAddCircleLine } as const;
const TONE = { audit: "text-text-sub-600", issue: "text-warning-base", site: "text-success-base" } as const;

/** Feed compacto só com eventos que existem no banco: auditorias, alertas calculados e sites adicionados. */
export default function ActivityFeed({ items, showSite = true }: { items: ActivityItem[]; showSite?: boolean }) {
  if (!items.length) return <p className="py-6 text-center text-paragraph-sm text-text-sub-600">Nenhuma atividade registrada ainda.</p>;
  return (
    <ol className="space-y-0.5">
      {items.map((it) => {
        const Icon = ICON[it.kind];
        return (
          <li key={it.id}>
            <Link href={it.href} className="flex items-start gap-3 rounded-lg px-1 py-2 transition duration-200 hover:bg-bg-weak-50 sm:px-2">
              <Icon className={`mt-0.5 size-4 flex-shrink-0 ${TONE[it.kind]}`} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-label-sm text-text-strong-950">
                  {it.title}
                  {showSite && <span className="font-normal text-text-sub-600"> · {it.siteName}</span>}
                </span>
                <span className="block truncate text-paragraph-xs text-text-sub-600">{it.detail}</span>
              </span>
              <time dateTime={new Date(it.at).toISOString()} className="flex-shrink-0 text-paragraph-xs text-text-soft-400">
                {formatDateTime(it.at).split(",")[0]}
              </time>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
