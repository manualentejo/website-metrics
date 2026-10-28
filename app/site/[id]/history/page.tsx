import Link from "next/link";
import SiteWorkspace from "@/components/site/SiteWorkspace";
import { Card, CardHeader } from "@/components/ui/Card";
import ChartEmptyState from "@/components/charts/ChartEmptyState";
import { formatDateTime } from "@/lib/format";
import { loadSiteReports } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

const Score = ({ v }: { v: number | null }) =>
  v === null ? <span className="text-text-soft-400">—</span> : (
    <span className={`tabular-nums ${v >= 90 ? "text-success-base" : v >= 50 ? "text-warning-base" : "text-error-base"}`}>{Math.round(v)}</span>
  );

export default async function SiteHistoryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ d?: string }> }) {
  const { id } = await params;
  const { d } = await searchParams;
  const strategy = d === "mobile" ? "mobile" : "desktop";
  const rows = await loadSiteReports(id, strategy, 52);

  return (
    <SiteWorkspace siteId={id} tab="history">
      <Card className="overflow-hidden">
        <CardHeader
          title="Histórico de auditorias"
          description="Uma por semana, até 52. Notas do Lighthouse."
          action={
            <div className="flex gap-3 text-label-xs">
              <Link href={`/site/${id}/history`} className={strategy === "desktop" ? "text-text-strong-950" : "text-text-sub-600"}>Computador</Link>
              <Link href={`/site/${id}/history?d=mobile`} className={strategy === "mobile" ? "text-text-strong-950" : "text-text-sub-600"}>Celular</Link>
            </div>
          }
        />
        {rows.length === 0 ? (
          <div className="p-5"><ChartEmptyState title="Nenhuma auditoria registrada" className="h-40" /></div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-paragraph-sm">
              <thead>
                <tr className="border-y border-stroke-soft-200 bg-bg-weak-50 text-subheading-xs uppercase text-text-soft-400">
                  <th className="px-5 py-2 font-normal">Data</th>
                  <th className="px-3 py-2 font-normal">Desemp.</th>
                  <th className="px-3 py-2 font-normal">Acessib.</th>
                  <th className="px-3 py-2 font-normal">Boas práticas</th>
                  <th className="px-3 py-2 font-normal">SEO</th>
                  <th className="px-5 py-2 text-right font-normal">LCP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-stroke-soft-200 last:border-b-0">
                    <td className="px-5 py-2.5 text-text-strong-950">{formatDateTime(r.ranAt)}</td>
                    <td className="px-3 py-2.5"><Score v={r.performanceScore} /></td>
                    <td className="px-3 py-2.5"><Score v={r.accessibilityScore} /></td>
                    <td className="px-3 py-2.5"><Score v={r.bestPracticesScore} /></td>
                    <td className="px-3 py-2.5"><Score v={r.seoScore} /></td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-text-sub-600">{r.lcpMs === null ? "—" : `${(r.lcpMs / 1000).toFixed(1).replace(".", ",")} s`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </SiteWorkspace>
  );
}
