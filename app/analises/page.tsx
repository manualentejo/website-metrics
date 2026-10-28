import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Page, Segmented, EmptyState } from "@/components/ui/Page";
import { getViewer } from "@/lib/access";
import { loadReportLog } from "@/lib/insights";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

function Score({ v }: { v: number | null }) {
  if (v === null) return <span className="text-muted-foreground">—</span>;
  const tone = v >= 90 ? "text-success" : v >= 50 ? "text-warning" : "text-destructive";
  return <span className={`font-medium tabular-nums ${tone}`}>{Math.round(v)}</span>;
}

export default async function AnalysesPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  const strategy = d === "mobile" ? "mobile" : "desktop";
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { log } = await loadReportLog(viewer, 400);
  const rows = log.filter((r) => r.strategy === strategy);

  return (
    <AppShell active="analises">
      <Page title="Análises" subtitle="Histórico de todas as análises feitas, da mais recente para a mais antiga (guardamos 52 semanas).">
        <Card className="overflow-hidden">
          <CardHeader
            title="Histórico de análises"
            action={
              <Segmented
                label="Dispositivo"
                items={[
                  { label: "Computador", href: "/analises", active: strategy === "desktop" },
                  { label: "Celular", href: "/analises?d=mobile", active: strategy === "mobile" },
                ]}
              />
            }
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-y border-border bg-secondary/60 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2">Data</th>
                  <th className="px-3 py-2">Site</th>
                  <th className="px-3 py-2">Desempenho</th>
                  <th className="px-3 py-2">Acessib.</th>
                  <th className="px-3 py-2">Boas práticas</th>
                  <th className="px-3 py-2">SEO</th>
                  <th className="px-5 py-2 text-right">LCP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-b-0 hover:bg-secondary/40">
                    <td className="px-5 py-2.5 text-muted-foreground">{formatDateTime(r.ranAt)}</td>
                    <td className="px-3 py-2.5">
                      <Link href={`/site/${r.siteId}?strategy=${strategy}`} className="font-medium text-foreground hover:underline">
                        {r.site.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5"><Score v={r.performanceScore} /></td>
                    <td className="px-3 py-2.5"><Score v={r.accessibilityScore} /></td>
                    <td className="px-3 py-2.5"><Score v={r.bestPracticesScore} /></td>
                    <td className="px-3 py-2.5"><Score v={r.seoScore} /></td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-muted-foreground">
                      {r.lcpMs === null ? "—" : `${(r.lcpMs / 1000).toFixed(1)} s`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="p-5">
                <EmptyState title="Nenhuma análise ainda">
                  A primeira análise aparece aqui assim que rodar. O dono do painel pode iniciá-la em Perfil › Relatório.
                </EmptyState>
              </div>
            )}
          </div>
        </Card>
      </Page>
    </AppShell>
  );
}
