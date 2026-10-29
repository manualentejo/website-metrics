import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { RiErrorWarningLine, RiFileChartLine, RiGlobalLine, RiRobot2Line, RiSearchEyeLine, RiSpeedUpLine } from "@remixicon/react";
import { Segmented } from "@/components/ui/Page";
import { buttonClass } from "@/components/ui/Button";
import MetricCard from "@/components/charts/MetricCard";
import TrendIndicator from "@/components/charts/TrendIndicator";
import TimeSeriesChart, { type Tone } from "@/components/charts/TimeSeriesChart";
import ChartEmptyState from "@/components/charts/ChartEmptyState";
import DonutChart from "@/components/charts/DonutChart";
import RunAuditButton from "@/components/overview/RunAuditButton";
import IssueList from "@/components/overview/IssueList";
import ActivityFeed from "@/components/overview/ActivityFeed";
import AIInsightsPanel from "@/components/overview/AIInsightsPanel";
import TabbedPanel from "@/components/overview/TabbedPanel";
import WebsitePerformanceTable from "@/components/overview/WebsitePerformanceTable";
import { getViewer } from "@/lib/access";
import { formatDateTime } from "@/lib/format";
import { PERIODS, loadPortfolio, lastValue, type Mover, type Period, type SeriesPair } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

const CHART_TABS = [
  { key: "seo", label: "SEO", tone: "green" },
  { key: "performance", label: "Desempenho", tone: "blue" },
  { key: "geo", label: "GEO", tone: "purple" },
  { key: "visits", label: "Visitas", tone: "orange" },
] as const;

/** Cartão do painel: altura limitada pelo grid, com o corpo rolando por dentro quando há muito conteúdo. */
function Panel({ title, description, action, children, className = "", scroll = true }: { title: ReactNode; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; scroll?: boolean }) {
  return (
    <section className={`flex min-h-[18rem] min-w-0 flex-col rounded-2xl bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 lg:min-h-0 ${className}`}>
      <header className="flex flex-shrink-0 items-start justify-between gap-3 px-4 pb-2 pt-3.5">
        <div className="min-w-0">
          <h2 className="truncate text-label-md text-text-strong-950">{title}</h2>
          {description && <p className="mt-0.5 truncate text-paragraph-xs text-text-sub-600">{description}</p>}
        </div>
        {action}
      </header>
      <div className={`min-h-0 flex-1 px-4 pb-4 ${scroll ? "overflow-y-auto" : "relative"}`}>{children}</div>
    </section>
  );
}

function Movers({ title, items, up }: { title: string; items: Mover[]; up: boolean }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-label-xs uppercase tracking-wide text-text-soft-400">{title}</p>
      {items.length === 0 ? (
        <p className="text-paragraph-xs text-text-sub-600">{up ? "Nenhuma melhora" : "Nenhuma queda"}</p>
      ) : (
        <ul className="space-y-0.5">
          {items.slice(0, 3).map((m) => (
            <li key={m.siteId}>
              <Link href={`/site/${m.siteId}/seo`} className="flex items-center justify-between gap-2 rounded-md py-0.5 text-paragraph-sm hover:bg-bg-weak-50">
                <span className="truncate text-text-strong-950">{m.siteName}</span>
                <TrendIndicator current={m.to} previous={m.from} goodWhen="up" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ d?: string; m?: string }> }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const days = (PERIODS.find((p) => String(p) === sp.d) ?? 28) as Period;
  const metric = CHART_TABS.find((t) => t.key === sp.m) ?? CHART_TABS[0];
  const p = await loadPortfolio(viewer, { days });

  const href = (over: Record<string, string | null>) => {
    const q = new URLSearchParams();
    const cur: Record<string, string | undefined> = { d: sp.d, m: sp.m };
    for (const [k, v] of Object.entries({ ...cur, ...over })) if (v) q.set(k, v);
    return q.toString() ? `/?${q}` : "/";
  };

  const auditable = viewer.owner ? p.allSites : [];
  const perfNow = lastValue(p.series.performance.current);
  const perfPrev = lastValue(p.series.performance.previous);
  const series: SeriesPair | null =
    metric.key === "seo" ? p.series.seo : metric.key === "performance" ? p.series.performance : metric.key === "geo" ? (p.geo?.series ?? null) : p.series.visits;
  const unit = metric.key === "visits" ? "count" : "score";
  const label = { seo: "SEO médio", performance: "Desempenho médio", geo: "Nota GEO média", visits: "Visitas" }[metric.key];
  const seoCount = p.distribution.reduce((a, b) => a + b.count, 0);
  const band = (key: "performance" | "geo") => {
    const v = p.rows.map((r) => r[key]).filter((x): x is number => x !== null);
    return [v.filter((x) => x >= 90).length, v.filter((x) => x >= 50 && x < 90).length, v.filter((x) => x < 50).length];
  };
  const perfBand = band("performance");
  const geoBand = band("geo");

  return (
    <div className="flex flex-col gap-3 p-4 sm:p-5 lg:h-full lg:overflow-hidden">
      <header className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-title-h6 text-text-strong-950">Visão geral</h1>
          <p className="text-paragraph-xs text-text-sub-600">
            Todos os seus sites em um só lugar{p.lastUpdate ? ` · última auditoria ${formatDateTime(p.lastUpdate)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Período" items={PERIODS.map((d) => ({ label: `${d} dias`, href: href({ d: d === 28 ? null : String(d) }), active: days === d }))} />
          <Link href="/relatorios" className={buttonClass("outline", "md")}>
            <RiFileChartLine className="size-4" />
            Relatórios
          </Link>
          <RunAuditButton sites={auditable} />
        </div>
      </header>

      {p.allSites.length === 0 ? (
        <ChartEmptyState kind="empty" title="Nenhum site monitorado" className="h-64" action={{ href: "/sites", label: "Adicionar um site" }}>
          Adicione o primeiro site para ver o consolidado do portfólio.
        </ChartEmptyState>
      ) : (
        <>
          <section aria-label="Indicadores principais" className="grid flex-shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              label="Sites"
              icon={RiGlobalLine}
              tone="blue"
              href="/sites"
              value={p.kpi.total}
              hint={`${p.kpi.live} no ar · ${p.kpi.total - p.kpi.live} em andamento`}
              info={{ title: "Sites", text: "Quantidade de sites monitorados no painel." }}
            />
            <MetricCard
              label="Saúde de SEO"
              icon={RiSearchEyeLine}
              tone="green"
              href={href({ m: "seo" })}
              value={p.kpi.seo === null ? "—" : Math.round(p.kpi.seo)}
              trend={<TrendIndicator current={p.kpi.seo} delta={p.kpi.seoDelta} suffix={`${days}d`} />}
              spark={p.kpi.seoSpark}
              info={{ title: "Saúde de SEO", text: "Média da nota de SEO técnico do Lighthouse (0–100). Medida de laboratório, não é posição no Google." }}
            />
            <MetricCard
              label="Desempenho"
              icon={RiSpeedUpLine}
              tone="orange"
              href={href({ m: "performance" })}
              value={perfNow === null ? "—" : Math.round(perfNow)}
              trend={<TrendIndicator current={perfNow} previous={perfPrev} suffix={`${days}d`} />}
              spark={p.series.performance.current.map((x) => x.value)}
              info={{ title: "Desempenho", text: "Média da nota de velocidade do Lighthouse (0–100), em ambiente de teste." }}
            />
            <MetricCard
              label="Nota GEO"
              icon={RiRobot2Line}
              tone="purple"
              href={href({ m: "geo" })}
              connected={!!p.geo}
              value={p.geo?.score == null ? "—" : Math.round(p.geo.score)}
              trend={<TrendIndicator current={p.geo?.score ?? null} delta={p.geo?.delta ?? null} suffix={`${days}d`} />}
              spark={p.geo?.series.current.map((x) => x.value)}
              setupText="Abra a aba GEO de um site para a primeira auditoria."
              info={{ title: "Nota GEO", text: "Quão preparado o site está para ser entendido e citado por IAs (ChatGPT, Gemini, Perplexity). Auditoria técnica, sem IA e sem custo." }}
            />
            <MetricCard
              label="Problemas críticos"
              icon={RiErrorWarningLine}
              tone="red"
              href="/alertas"
              value={p.kpi.critical}
              hint={`${p.kpi.problems} alertas abertos`}
              info={{ title: "Problemas críticos", text: "Notas abaixo de 50 ou quedas de 15 pontos ou mais. Aqui, menos é melhor." }}
            />
          </section>

          <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:grid-rows-2">
            <Panel
              className="lg:col-span-8"
              scroll={false}
              title="Desempenho do portfólio"
              description={`${label}, ${days} dias contra os ${days} anteriores`}
              action={
                <div className="max-w-full overflow-x-auto">
                  <Segmented label="Métrica" items={CHART_TABS.map((t) => ({ label: t.label, href: href({ m: t.key }), active: metric.key === t.key }))} />
                </div>
              }
            >
              <div className="absolute inset-x-4 inset-y-0 bottom-3 min-h-[15rem]">
                {metric.key === "visits" && p.visitsError ? (
                  <ChartEmptyState kind="error" title="Não foi possível carregar as visitas" className="h-full">{viewer.owner ? p.visitsError : "Tente novamente em instantes."}</ChartEmptyState>
                ) : !series ? (
                  <ChartEmptyState
                    title={metric.key === "geo" ? "Sem auditoria GEO ainda" : "Nenhum site com contagem de visitas"}
                    className="h-full"
                    action={{ href: "/sites", label: "Ver sites" }}
                  >
                    {metric.key === "geo" ? "A nota GEO aparece depois da primeira auditoria, na aba GEO de um site." : "A contagem só existe em sites com o código de rastreio instalado."}
                  </ChartEmptyState>
                ) : (
                  <TimeSeriesChart current={series.current} previous={series.previous} unit={unit} label={label} tone={metric.tone as Tone} fill />
                )}
              </div>
            </Panel>

            <Panel className="lg:col-span-4" title="Sites por faixa de nota" description="Quantos sites em cada faixa" action={<Link href="/comparativo" className="text-label-xs text-text-sub-600 underline underline-offset-2 hover:text-text-strong-950">Comparar</Link>}>
              {seoCount === 0 ? (
                <ChartEmptyState title="Sem notas ainda" className="h-full min-h-[10rem]" />
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="mb-1.5 text-label-xs uppercase tracking-wide text-text-soft-400">SEO</p>
                    <DonutChart
                      size={104}
                      center={String(seoCount)}
                      centerLabel="sites"
                      slices={[
                        { label: "Bom (90–100)", value: p.distribution[0].count, tone: "success" },
                        { label: "Médio (50–89)", value: p.distribution[1].count, tone: "warning" },
                        { label: "Ruim (0–49)", value: p.distribution[2].count, tone: "error" },
                      ]}
                    />
                  </div>
                  <div className="border-t border-stroke-soft-200 pt-3">
                    <p className="mb-1.5 text-label-xs uppercase tracking-wide text-text-soft-400">Desempenho</p>
                    <DonutChart
                      size={104}
                      center={String(perfBand.reduce((a, b) => a + b, 0))}
                      centerLabel="sites"
                      slices={[
                        { label: "Bom (90–100)", value: perfBand[0], tone: "success" },
                        { label: "Médio (50–89)", value: perfBand[1], tone: "warning" },
                        { label: "Ruim (0–49)", value: perfBand[2], tone: "error" },
                      ]}
                    />
                  </div>
                  {geoBand.some(Boolean) && (
                    <div className="border-t border-stroke-soft-200 pt-3">
                      <p className="mb-1.5 text-label-xs uppercase tracking-wide text-text-soft-400">GEO</p>
                      <DonutChart
                        size={104}
                        center={String(geoBand.reduce((a, b) => a + b, 0))}
                        centerLabel="sites"
                        slices={[
                          { label: "Bom (90–100)", value: geoBand[0], tone: "success" },
                          { label: "Médio (50–89)", value: geoBand[1], tone: "warning" },
                          { label: "Ruim (0–49)", value: geoBand[2], tone: "error" },
                        ]}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 border-t border-stroke-soft-200 pt-3">
                    <Movers title="SEO melhorou" items={p.seoMovers.up} up />
                    <Movers title="SEO piorou" items={p.seoMovers.down} up={false} />
                  </div>
                </div>
              )}
            </Panel>

            <Panel className="lg:col-span-5" title="Sites" description={`${p.rows.length} monitorados · ordene pelas colunas`} action={<Link href="/sites" className="text-label-xs text-text-sub-600 underline underline-offset-2 hover:text-text-strong-950">Gerenciar</Link>}>
              <div className="-mx-4 -mt-1">
                <WebsitePerformanceTable rows={p.rows} />
              </div>
            </Panel>

            <Panel
              className="lg:col-span-4"
              title="Precisa da sua atenção"
              description="Do mais grave ao menos grave"
              action={<Link href="/alertas" className="text-label-xs text-text-sub-600 underline underline-offset-2 hover:text-text-strong-950">Todos</Link>}
            >
              <IssueList issues={p.attention} dense />
            </Panel>

            <section className="flex min-h-[18rem] min-w-0 flex-col rounded-2xl bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 lg:col-span-3 lg:min-h-0">
              <TabbedPanel
                tabs={[
                  { key: "resumo", label: "Resumo", node: <AIInsightsPanel insights={p.insights} compact /> },
                  { key: "atividade", label: "Atividade", node: <ActivityFeed items={p.activity} /> },
                ]}
              />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
