import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Page, Segmented, EmptyState } from "@/components/ui/Page";
import { getViewer } from "@/lib/access";
import { loadReportLog } from "@/lib/insights";

export const dynamic = "force-dynamic";

const COLS = [
  { key: "performanceScore", label: "Desempenho" },
  { key: "accessibilityScore", label: "Acessibilidade" },
  { key: "bestPracticesScore", label: "Boas práticas" },
  { key: "seoScore", label: "SEO" },
] as const;

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  const strategy = d === "mobile" ? "mobile" : "desktop";
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { visible, log } = await loadReportLog(viewer, 600);

  const rows = visible
    .map((site) => ({ site, r: log.find((x) => x.siteId === site.id && x.strategy === strategy) ?? null }))
    .filter((x): x is { site: (typeof visible)[number]; r: NonNullable<typeof x.r> } => x.r !== null);
  const best: Record<string, number> = {};
  for (const c of COLS) best[c.key] = Math.max(0, ...rows.map((x) => x.r[c.key] ?? 0));
  const avg = (x: (typeof rows)[number]) => {
    const v = COLS.map((c) => x.r[c.key]).filter((n): n is number => typeof n === "number");
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };
  rows.sort((a, b) => avg(b) - avg(a));

  return (
    <AppShell active="comparativo">
      <Page
        title="Comparativo"
        subtitle="Seus sites lado a lado, do melhor para o pior. Para acompanhar concorrentes, adicione o site deles em um workspace chamado Concorrentes."
      >
        <Card className="overflow-hidden">
          <CardHeader
            title="Ranking por nota média"
            action={
              <Segmented
                label="Dispositivo"
                items={[
                  { label: "Computador", href: "/comparativo", active: strategy === "desktop" },
                  { label: "Celular", href: "/comparativo?d=mobile", active: strategy === "mobile" },
                ]}
              />
            }
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-paragraph-sm">
              <thead>
                <tr className="border-y border-stroke-soft-200 bg-bg-weak-50 text-paragraph-xs font-medium uppercase tracking-wider text-text-sub-600">
                  <th className="px-5 py-2">#</th>
                  <th className="px-3 py-2">Site</th>
                  {COLS.map((c) => (
                    <th key={c.key} className="px-3 py-2">{c.label}</th>
                  ))}
                  <th className="px-5 py-2 text-right">Média</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((x, i) => (
                  <tr key={x.site.id} className="border-b border-stroke-soft-200 last:border-b-0 hover:bg-bg-weak-50">
                    <td className="px-5 py-2.5 tabular-nums text-text-sub-600">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <Link href={`/site/${x.site.id}?strategy=${strategy}`} className="font-medium text-text-strong-950 hover:underline">
                        {x.site.name}
                      </Link>
                    </td>
                    {COLS.map((c) => {
                      const v = x.r[c.key];
                      const isBest = v !== null && v === best[c.key] && rows.length > 1;
                      return (
                        <td key={c.key} className="px-3 py-2.5 tabular-nums">
                          <span className={isBest ? "rounded-sm bg-success-lighter px-1.5 py-0.5 font-medium text-success-base" : "text-text-strong-950"}>
                            {v === null ? "—" : Math.round(v)}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-5 py-2.5 text-right font-medium tabular-nums">{Math.round(avg(x))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="p-5">
                <EmptyState title="Sem dados para comparar">Rode a primeira análise para ver o ranking.</EmptyState>
              </div>
            )}
          </div>
          <p className="border-t border-stroke-soft-200 px-5 py-2.5 text-paragraph-xs text-text-sub-600">
            Em verde, a melhor nota de cada categoria.
          </p>
        </Card>
      </Page>
    </AppShell>
  );
}
