import Link from "next/link";
import ScoreGauge from "./ScoreGauge";
import StatusSelect from "./StatusSelect";
import type { Status } from "@/lib/types";

export default function SiteSummaryCard({
  id,
  name,
  url,
  status,
  latest,
}: {
  id: string;
  name: string;
  url: string;
  status: Status;
  latest: {
    performanceScore: number | null;
    accessibilityScore: number | null;
    bestPracticesScore: number | null;
    seoScore: number | null;
  } | null;
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/site/${id}`} className="block min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-900 hover:text-indigo-700">{name}</h2>
          <p className="truncate text-sm text-slate-500">{url}</p>
        </Link>
        <StatusSelect siteId={id} status={status} />
      </div>

      <Link href={`/site/${id}`} className="mt-5 flex justify-around">
        <ScoreGauge score={latest?.performanceScore ?? null} label="Performance" size={64} />
        <ScoreGauge score={latest?.accessibilityScore ?? null} label="Acessibilidade" size={64} />
        <ScoreGauge score={latest?.bestPracticesScore ?? null} label="Boas Práticas" size={64} />
        <ScoreGauge score={latest?.seoScore ?? null} label="SEO" size={64} />
      </Link>

      {!latest && (
        <p className="mt-4 text-center text-xs text-slate-400">Sem dados ainda — a primeira análise roda na próxima sexta.</p>
      )}
    </div>
  );
}
