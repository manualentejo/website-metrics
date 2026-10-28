import Link from "next/link";
import { redirect } from "next/navigation";
import { RiFileChartLine } from "@remixicon/react";
import AppShell from "@/components/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Page, Segmented } from "@/components/ui/Page";
import { buttonClass } from "@/components/ui/Button";
import MetricCard from "@/components/charts/MetricCard";
import TrendIndicator from "@/components/charts/TrendIndicator";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import ChartEmptyState from "@/components/charts/ChartEmptyState";
import ComparisonChart from "@/components/charts/ComparisonChart";
import HealthDistributionChart from "@/components/charts/HealthDistributionChart";
import SiteFilter from "@/components/overview/SiteFilter";
import RunAuditButton from "@/components/overview/RunAuditButton";
import IssueList from "@/components/overview/IssueList";
import ActivityFeed from "@/components/overview/ActivityFeed";
import AIInsightsPanel from "@/components/overview/AIInsightsPanel";
import WebsitePerformanceTable from "@/components/overview/WebsitePerformanceTable";
import { getViewer } from "@/lib/access";
import { formatDateTime } from "@/lib/format";
import { PERIODS, loadPortfolio, type Mover, type Period } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

const CHART_TABS = [
  { key: "clicks", label: "Cliques orgânicos" },
  { key: "visits", label: "Visitas" },
  { key: "seo", label: "SEO" },
  { key: "performance", label: "Desempenho" },
  { key: "ai", label: "AI Visibility" },
] as const;

function Movers({ title, items, good }: { title: string; items: Mover[]; good: boolean }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-label-xs uppercase tracking-wide text-text-soft-400">{title}</p>
      {items.length === 0 ? (
        <p className="text-paragraph-xs text-text-sub-600">{good ? "Nenhuma melhora" : "Nenhuma queda"} entre as duas últimas auditorias.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((m) => (
            <li key={m.siteId}>
              <Link href={`/site/${m.siteId}/seo`} className="flex items-center justify-between gap-2 rounded-md py-0.5 text-paragraph-sm hover:bg-bg-weak-50">
                <span className="truncate text-text-strong-950">{m.siteName}</span>
                <span className="flex-shrink-0">
                  <TrendIndicator current={m.to} previous={m.from} goodWhen="up" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function HomePage({ searchParams }: { searchParams: Promise<{ d?: string; sites?: string; m?: string }> }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const days = (PERIODS.find((p) => String(p) === sp.d) ?? 28) as Period;
  const siteIds = sp.sites ? sp.sites.split(",").filter(Boolean) : null;
  const metric = CHART_TABS.find((t) => t.key === sp.m)?.key ?? "seo";
  const p = await loadPortfolio(viewer, { days, siteIds });

  const href = (over: Record<string, string | null>) => {
    const q = new URLSearchParams();
    const cur: Record<string, string | undefined> = { d: sp.d, sites: sp.sites, m: sp.m };
    for (const [k, v] of Object.entries({ ...cur, ...over })) if (v) q.set(k, v);
    return q.toString() ? `/?${q}` : "/";
  };

  const auditable = viewer.owner ? p.allSites.filter((s) => p.selectedIds.includes(s.id)) : [];
  const geoSite = p.selectedIds[0];

  const series = metric === "seo" ? p.series.seo : metric === "performance" ? p.series.performance : metric === "visits" ? p.series.visits : null;
  const chartUnit = metric === "visits" ? "count" : "score";
  const chartLabel = metric === "seo" ? "SEO médio" : metric === "performance" ? "Desempenho médio" : "Visitas";

  return (
    <AppShell active="home">
      <Page
        title="Visão geral"
        subtitle="Todos os seus sites em um só lugar."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="Período" items={PERIODS.map((d) => ({ label: `${d} dias`, href: href({ d: d === 28 ? null : String(d) }), active: days === d }))} />
            <SiteFilter sites={p.allSites} selected={siteIds ?? []} />
            <Link href="/relatorios" className={buttonClass("outline", "md")}>
              <RiFileChartLine className="size-4" />
              Relatórios
            </Link>
            <RunAuditButton sites={auditable} />
          </div>
        }
      >
        <p className="-mt-3 text-paragraph-xs text-text-soft-400">
          {p.lastUpdate ? `Última auditoria: ${formatDateTime(p.lastUpdate)}` : "Nenhuma auditoria ainda"} · Notas do Lighthouse (computador), janela de {days} dias comparada
          aos {days} dias anteriores.
        </p>

        {p.allSites.length === 0 ? (
          <ChartEmptyState kind="empty" title="Nenhum site monitorado" className="h-64" action={{ href: "/sites", label: "Adicionar um site" }}>
            Adicione o primeiro site para ver o consolidado do portfólio.
          </ChartEmptyState>
        ) : (
          <>
            {/* 02 · Indicadores */}
            <section aria-label="Indicadores principais" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
              <MetricCard
                label="Sites monitorados"
                href="/sites"
                value={p.kpi.total}
                hint={`${p.kpi.live} no ar · ${p.kpi.total - p.kpi.live} em andamento`}
                info={{ title: "Sites monitorados", text: "Quantidade de sites no filtro atual. Fonte: seu cadastro no painel." }}
              />
              <MetricCard
                label="Saúde de SEO"
                href={href({ m: "seo" })}
                value={p.kpi.seo === null ? "—" : Math.round(p.kpi.seo)}
                trend={<TrendIndicator current={p.kpi.seo} delta={p.kpi.seoDelta} suffix={`vs ${days} dias antes`} />}
                spark={p.kpi.seoSpark}
                hint="Lighthouse · computador"
                info={{
                  title: "Saúde de SEO",
                  text: "Média da nota de SEO técnico do Lighthouse (0–100) entre os sites filtrados, usando a auditoria mais recente de cada um em cada dia. É medida de laboratório, não ranking no Google nem dado de usuários reais.",
                }}
              />
              <MetricCard
                label="Cliques orgânicos"
                href="/perfil"
                connected={false}
                setupText="Depende do Google Search Console, ainda não conectado. Nenhum número é estimado."
                info={{ title: "Cliques orgânicos", text: "Cliques vindos da busca do Google, medidos pelo Search Console. Fonte futura: integração autorizada." }}
              />
              <MetricCard
                label="AI Visibility"
                href={href({ m: "ai" })}
                connected={!!p.geo}
                value={p.geo?.rate == null ? "—" : `${Math.round(p.geo.rate)}%`}
                trend={<TrendIndicator current={p.geo?.rate ?? null} delta={p.geo?.delta ?? null} suffix={`vs ${days} dias antes`} />}
                spark={p.geo?.series.current.map((x) => x.value)}
                hint={p.geo ? `${p.geo.sites.length} site(s) · só Gemini, prompts cadastrados` : undefined}
                setupText="Conta menções em prompts que você monitora, não toda a atividade das IAs. Configure na aba GEO de um site."
                info={{
                  title: "AI Visibility",
                  text: "Média, entre os sites verificados, da % de respostas do Gemini aos prompts monitorados que citam a marca. Não representa toda a atividade das plataformas de IA nem é o GEO Technical Score.",
                }}
              />
              <MetricCard
                label="Problemas críticos"
                href="/alertas"
                value={p.kpi.critical}
                trend={<TrendIndicator current={p.kpi.critical} delta={null} goodWhen="down" />}
                hint={`${p.kpi.problems} alertas abertos no total`}
                info={{
                  title: "Problemas críticos",
                  text: "Alertas críticos abertos: notas abaixo de 50 ou quedas de 15 pontos ou mais desde a auditoria anterior. Aqui, menos é melhor.",
                }}
              />
            </section>

            {/* 03 · Desempenho do portfólio */}
            <Card>
              <CardHeader
                title="Desempenho do portfólio"
                description={
                  series
                    ? `${chartLabel}, ${days} dias contra os ${days} anteriores. ${
                        metric === "visits"
                          ? `Contagem própria (sem cookies), só nos ${p.trackedSites} site(s) com código instalado.`
                          : "Cada dia usa a auditoria mais recente de cada site."
                      }`
                    : "Escolha uma métrica. Cada uma usa sua própria unidade e escala."
                }
                action={
                  <div className="max-w-full overflow-x-auto">
                    <Segmented label="Métrica" items={CHART_TABS.map((t) => ({ label: t.label, href: href({ m: t.key }), active: metric === t.key }))} />
                  </div>
                }
              />
              <div className="px-5 pb-5 pt-4">
                {metric === "clicks" ? (
                  <ChartEmptyState kind="setup" title="Search Console não conectado" className="h-72">
                    Cliques e impressões só aparecem com dados autorizados do Google Search Console. Até lá, usamos apenas dados que existem de verdade.
                  </ChartEmptyState>
                ) : metric === "ai" && p.geo ? (
                  <TimeSeriesChart current={p.geo.series.current} previous={p.geo.series.previous} unit="score" label="AI Visibility (%)" height={300} />
                ) : metric === "ai" ? (
                  <ChartEmptyState kind="setup" title="Nenhum prompt monitorado" className="h-72" action={geoSite ? { href: `/site/${geoSite}/geo`, label: "Configurar no GEO do site" } : undefined}>
                    AI Visibility mede menções em prompts que você cadastra na aba GEO de cada site.
                  </ChartEmptyState>
                ) : metric === "visits" && p.visitsError ? (
                  <ChartEmptyState kind="error" title="Não foi possível carregar as visitas" className="h-72">
                    {viewer.owner ? p.visitsError : "Tente novamente em instantes."}
                  </ChartEmptyState>
                ) : !series ? (
                  <ChartEmptyState title="Nenhum site com contagem de visitas" className="h-72" action={{ href: "/sites", label: "Ver sites" }}>
                    Instale o código de rastreio nos sites que você pode editar para ver visitas aqui.
                  </ChartEmptyState>
                ) : (
                  <TimeSeriesChart current={series.current} previous={series.previous} unit={chartUnit} label={chartLabel} height={300} />
                )}
              </div>
            </Card>

            {/* 04 · SEO e GEO */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="flex flex-col">
                <CardHeader
                  title="Saúde de SEO"
                  description="Nota técnica do Lighthouse, média dos sites filtrados."
                  action={<Link href="/analises" className="text-label-xs text-text-strong-950 underline underline-offset-2">Ver auditorias</Link>}
                />
                <div className="space-y-5 p-5">
                  <TimeSeriesChart current={p.series.seo.current} previous={p.series.seo.previous} unit="score" label="SEO médio" height={180} />
                  <HealthDistributionChart buckets={p.distribution} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Movers title="Maior melhoria" items={p.seoMovers.up} good />
                    <Movers title="Maior regressão" items={p.seoMovers.down} good={false} />
                  </div>
                </div>
              </Card>

              <Card className="flex flex-col">
                <CardHeader
                  title="AI Visibility"
                  description="Menções e citações em prompts monitorados."
                  action={
                    geoSite && (
                      <Link href={`/site/${geoSite}/geo`} className="text-label-xs text-text-strong-950 underline underline-offset-2">
                        Abrir GEO
                      </Link>
                    )
                  }
                />
                <div className="flex flex-1 flex-col gap-5 p-5">
                  {p.geo ? (
                    <>
                      <TimeSeriesChart current={p.geo.series.current} previous={p.geo.series.previous} unit="score" label="Menções (%)" height={180} />
                      <div>
                        <p className="mb-2 text-label-xs uppercase tracking-wide text-text-soft-400">Por site (Gemini)</p>
                        <ComparisonChart items={p.geo.sites.slice(0, 5).map((x) => ({ label: x.name, value: x.rate }))} />
                      </div>
                      <p className="text-paragraph-xs text-text-sub-600">
                        Citações verificadas: {p.geo.verifiable ? `${p.geo.cited} de ${p.geo.verifiable} respostas trouxeram o domínio entre as fontes.` : "busca do Google indisponível."} Outros
                        mecanismos (ChatGPT, Perplexity) não estão conectados.
                      </p>
                    </>
                  ) : (
                    <ChartEmptyState kind="setup" title="Monitoramento de IA ainda não configurado" className="min-h-[22rem] flex-1" action={geoSite ? { href: `/site/${geoSite}/geo`, label: "Configurar no GEO do site" } : undefined}>
                      Cadastre a marca e os prompts na aba GEO de um site e rode a verificação. Aqui aparecem a evolução, a comparação entre sites e as citações. O GEO Technical Score é outra coisa.
                    </ChartEmptyState>
                  )}
                </div>
              </Card>
            </div>

            {/* 05 · Precisa de atenção */}
            <Card>
              <CardHeader
                title="Precisa da sua atenção"
                description="Problemas abertos em todos os sites, do mais grave ao menos grave. Clique para abrir a análise do site."
                action={<Link href="/alertas" className="text-label-xs text-text-strong-950 underline underline-offset-2">Todos os alertas</Link>}
              />
              <div className="px-4 pb-3 pt-2 sm:px-5">
                <IssueList issues={p.attention} />
              </div>
            </Card>

            {/* 06 · Comparação entre sites */}
            <Card className="overflow-hidden">
              <CardHeader
                title="Comparação entre sites"
                description="Notas do Lighthouse no computador. Cliques orgânicos e AI Visibility entram aqui quando forem conectados."
                action={<Link href="/sites" className="text-label-xs text-text-strong-950 underline underline-offset-2">Gerenciar sites</Link>}
              />
              <div className="mt-3">
                <WebsitePerformanceTable rows={p.rows} />
              </div>
            </Card>

            {/* 07 e 08 */}
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <Card>
                <CardHeader title="Resumo da semana" description="Fundamentado nas notas e alertas acima; nada é inferido além dos dados." />
                <div className="px-5 pb-4 pt-2">
                  <AIInsightsPanel insights={p.insights} />
                </div>
              </Card>
              <Card>
                <CardHeader title="Atividade recente" description="O que mudou desde sua última visita." />
                <div className="px-3 pb-3 pt-2 sm:px-4">
                  <ActivityFeed items={p.activity} />
                </div>
              </Card>
            </div>
          </>
        )}
      </Page>
    </AppShell>
  );
}
