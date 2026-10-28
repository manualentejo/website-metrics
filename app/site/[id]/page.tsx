import Link from "next/link";
import { redirect } from "next/navigation";
import SiteWorkspace, { requireSite } from "@/components/site/SiteWorkspace";
import { Card, CardHeader } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Page";
import MetricCard from "@/components/charts/MetricCard";
import TrendIndicator from "@/components/charts/TrendIndicator";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import ChartEmptyState from "@/components/charts/ChartEmptyState";
import IssueList from "@/components/overview/IssueList";
import ActivityFeed from "@/components/overview/ActivityFeed";
import AIInsightsPanel from "@/components/overview/AIInsightsPanel";
import { loadFixQueue } from "@/lib/insights";
import { PERIODS, loadPortfolio, lastValue, type Period } from "@/lib/portfolio";
import { buttonClass } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

// Visão geral de UM site: o mesmo motor de dados do Overview global, filtrado para este site.
export default async function SiteOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ strategy?: string; config?: string; d?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  // Links antigos (/site/ID?strategy=… e ?config=1) continuam funcionando.
  if (sp.config) redirect(`/site/${id}/settings?config=1`);
  if (sp.strategy) redirect(`/site/${id}/performance?strategy=${sp.strategy === "mobile" ? "mobile" : "desktop"}`);

  const days = (PERIODS.find((p) => String(p) === sp.d) ?? 28) as Period;
  const { viewer, site } = await requireSite(id);
  const [p, fixes] = await Promise.all([loadPortfolio(viewer, { days, siteIds: [id] }), loadFixQueue(viewer)]);
  const row = p.rows[0];
  const opportunities = fixes.filter((f) => f.siteId === id).slice(0, 5);
  const perfNow = lastValue(p.series.performance.current);
  const perfPrev = lastValue(p.series.performance.previous);
  const period = (d: number) => ({ label: `${d} dias`, href: d === 28 ? `/site/${id}` : `/site/${id}?d=${d}`, active: days === d });

  return (
    <SiteWorkspace siteId={id} tab="overview">
      <div className="flex justify-end">
        <Segmented label="Período" items={PERIODS.map(period)} />
      </div>

      <section aria-label="Indicadores do site" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Saúde de SEO"
          href={`/site/${id}/seo`}
          value={p.kpi.seo === null ? "—" : Math.round(p.kpi.seo)}
          trend={<TrendIndicator current={p.kpi.seo} delta={p.kpi.seoDelta} suffix={`vs ${days} dias antes`} />}
          spark={p.kpi.seoSpark}
          hint="Lighthouse · computador"
          info={{ title: "Saúde de SEO", text: "Nota de SEO técnico do Lighthouse (0–100), medida em laboratório. Não é posição no Google." }}
        />
        <MetricCard
          label="Desempenho"
          href={`/site/${id}/performance`}
          value={perfNow === null ? "—" : Math.round(perfNow)}
          trend={<TrendIndicator current={perfNow} previous={perfPrev} suffix={`vs ${days} dias antes`} />}
          spark={p.series.performance.current.map((x) => x.value)}
          hint="Lighthouse · computador"
          info={{ title: "Desempenho", text: "Nota de velocidade do Lighthouse (0–100) em ambiente de teste, não a experiência medida em usuários reais." }}
        />
        <MetricCard
          label="Visitas"
          href={`/site/${id}/analytics`}
          connected={!!p.series.visits}
          value={row?.visits?.toLocaleString("pt-BR")}
          trend={
            p.series.visits ? (
              <TrendIndicator
                unit="count"
                current={p.series.visits.current.reduce((a, b) => a + (b.value ?? 0), 0)}
                previous={p.series.visits.previous.reduce((a, b) => a + (b.value ?? 0), 0)}
                suffix={`vs ${days} dias antes`}
              />
            ) : undefined
          }
          spark={p.series.visits?.current.map((x) => x.value)}
          hint="Contagem própria, sem cookies"
          setupText="Sem código de rastreio neste site. Instale em Configurações, só se você puder editar o site."
          info={{ title: "Visitas", text: "Visualizações de página contadas pelo código de rastreio próprio. Só existe em sites onde o código foi instalado." }}
        />
        <MetricCard
          label="Problemas críticos"
          href="/alertas"
          value={p.kpi.critical}
          trend={<TrendIndicator current={p.kpi.critical} delta={null} goodWhen="down" />}
          hint={`${p.kpi.problems} alertas abertos`}
          info={{ title: "Problemas críticos", text: "Notas abaixo de 50 ou quedas de 15 pontos ou mais desde a auditoria anterior. Menos é melhor." }}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Evolução de SEO" description={`${days} dias contra os ${days} anteriores.`} />
          <div className="p-5"><TimeSeriesChart current={p.series.seo.current} previous={p.series.seo.previous} unit="score" label="SEO" height={220} /></div>
        </Card>
        <Card>
          <CardHeader title="Evolução de desempenho" description={`${days} dias contra os ${days} anteriores.`} />
          <div className="p-5"><TimeSeriesChart current={p.series.performance.current} previous={p.series.performance.previous} unit="score" label="Desempenho" height={220} /></div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Tráfego orgânico" description="Cliques e impressões do Google Search Console." />
          <div className="p-5">
            <ChartEmptyState kind="setup" title="Search Console não conectado" className="h-44">
              Sem a integração, nenhum número de tráfego orgânico é exibido. As visitas próprias aparecem na aba Visitas.
            </ChartEmptyState>
          </div>
        </Card>
        <Card>
          <CardHeader
            title="Resumo GEO"
            action={<Link href={`/site/${id}/geo`} className="text-label-xs text-text-strong-950 underline underline-offset-2">Abrir GEO</Link>}
          />
          <div className="p-5">
            <ChartEmptyState kind="setup" title="Nenhum prompt monitorado" className="h-44">
              AI Visibility só passa a existir depois que você cadastrar prompts para acompanhar.
            </ChartEmptyState>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Principais problemas" description="Abertos na última auditoria deste site." />
        <div className="px-4 pb-3 pt-2 sm:px-5"><IssueList issues={p.attention} showSite={false} /></div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Oportunidades"
            description="Auditorias reprovadas que mais pesam na nota, no computador."
            action={<Link href={`/site/${id}/performance`} className={buttonClass("ghost", "sm")}>Ver análise</Link>}
          />
          <div className="px-4 pb-3 pt-2 sm:px-5">
            {opportunities.length === 0 ? (
              <p className="py-4 text-paragraph-sm text-text-sub-600">Nada reprovado na análise detalhada atual.</p>
            ) : (
              <ul className="divide-y divide-stroke-soft-200">
                {opportunities.map((o) => (
                  <li key={o.auditId} className="py-2.5">
                    <Link href={`/site/${id}/${o.auditId.includes("seo") || /canonical|meta|robots|hreflang|crawl|link-text|document-title|http-status/.test(o.auditId) ? "seo" : "performance"}`} className="block hover:underline">
                      <span className="block text-label-sm text-text-strong-950">{o.title}</span>
                      <span className="block text-paragraph-xs text-text-sub-600">{o.displayValue ?? o.plain ?? ""}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Atividade recente" />
          <div className="px-3 pb-3 pt-2 sm:px-4"><ActivityFeed items={p.activity} showSite={false} /></div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Resumo da semana" description={`Só com os dados de ${site.name}.`} />
        <div className="px-5 pb-4 pt-2"><AIInsightsPanel insights={p.insights} /></div>
      </Card>
    </SiteWorkspace>
  );
}
