import SiteWorkspace, { requireSite } from "@/components/site/SiteWorkspace";
import GeoManager from "@/components/site/GeoManager";
import { Card, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import MetricCard from "@/components/charts/MetricCard";
import TrendIndicator from "@/components/charts/TrendIndicator";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import ComparisonChart from "@/components/charts/ComparisonChart";
import ChartEmptyState from "@/components/charts/ChartEmptyState";
import { formatDateTime } from "@/lib/format";
import { getGeo } from "@/lib/geo";
import { getGeoAudits } from "@/lib/geoAudit";
import GeoAuditPanel from "@/components/site/GeoAuditPanel";
import { dayKey } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);

// Visibilidade em IA do site: prompts cadastrados, consultados no Gemini com busca do Google.
export default async function SiteGeoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { viewer, site } = await requireSite(id);

  let geo: Awaited<ReturnType<typeof getGeo>> | null = null;
  let loadError: string | null = null;
  try {
    geo = await getGeo(id, site.name);
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }

  const audits = await getGeoAudits(id).catch(() => []);
  const latestAudit = audits[0];
  const auditSeries = [...audits].reverse().map((a) => ({ date: dayKey(a.ranAt), value: a.score }));

  const latest = geo?.batches[0];
  const previous = geo?.batches[1];
  const rate = latest ? pct(latest.mentioned, latest.total) : null;
  const prevRate = previous ? pct(previous.mentioned, previous.total) : null;

  // Uma ponto por dia (a última verificação do dia), do mais antigo para o mais novo.
  const byDay = new Map<string, number>();
  for (const b of [...(geo?.batches ?? [])].reverse()) byDay.set(dayKey(b.ranAt), pct(b.mentioned, b.total));
  const series = [...byDay.entries()].map(([date, value]) => ({ date, value }));

  const sov = latest
    ? [
        { label: geo!.settings.brand, value: pct(latest.mentioned, latest.total), sub: `${latest.mentioned}/${latest.total}` },
        ...geo!.settings.competitors
          .map((c) => {
            const n = latest.results.filter((r) => r.competitors.includes(c)).length;
            return { label: c, value: pct(n, latest.total), sub: `${n}/${latest.total}` };
          })
          .sort((a, b) => b.value - a.value),
      ]
    : [];

  return (
    <SiteWorkspace siteId={id} tab="geo">
      <Card>
        <CardHeader
          title="Seu site está pronto para as IAs?"
          description="GEO é fazer o ChatGPT, o Gemini e o Perplexity entenderem e citarem o seu site. Esta auditoria confere isso lendo o site, sem usar IA e sem custo."
        />
        <div className="space-y-5 p-5">
          <GeoAuditPanel
            siteId={id}
            score={latestAudit?.score ?? null}
            previousScore={audits[1]?.score ?? null}
            checks={latestAudit?.checks ?? []}
            canRun={viewer.owner}
          />
          {auditSeries.length >= 2 && (
            <div>
              <p className="mb-2 text-label-xs uppercase tracking-wide text-text-soft-400">Evolução da nota GEO</p>
              <TimeSeriesChart current={auditSeries} unit="score" label="Nota GEO" height={180} />
            </div>
          )}
          {latestAudit && <p className="text-paragraph-xs text-text-soft-400">Última auditoria: {formatDateTime(latestAudit.ranAt)}. Mede o preparo técnico, não quantas vezes as IAs citam você.</p>}
        </div>
      </Card>

      <Card>
        <CardHeader title="Preciso de palavras-chave?" />
        <div className="space-y-2 px-5 pb-5 pt-2 text-paragraph-sm text-text-sub-600">
          <p>Não do jeito antigo. Quem usa IA faz perguntas completas, como “qual a melhor clínica de X na minha cidade?”. Por isso o que mais ajuda é:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Escrever, no site, as respostas às perguntas que seus clientes fazem.</li>
            <li>Dizer com clareza quem você é, o que faz e onde atua.</li>
            <li>Manter as informações em código (dados estruturados), como a lista acima mostra.</li>
          </ul>
        </div>
      </Card>

      <details className="group rounded-2xl bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
          <span>
            <span className="block text-label-md text-text-strong-950">Avançado: monitorar se o Gemini cita sua marca</span>
            <span className="block text-paragraph-xs text-text-sub-600">Opcional. Faz perguntas ao Gemini e usa créditos da sua conta do Gemini.</span>
          </span>
          <span className="text-label-xs text-text-sub-600 group-open:hidden">Abrir</span>
        </summary>
        <div className="space-y-6 border-t border-stroke-soft-200 p-5">
      {loadError && (
        <ChartEmptyState kind="error" title="Não foi possível carregar o GEO" className="h-32">
          {viewer.owner ? loadError : "Tente de novo em instantes."}
        </ChartEmptyState>
      )}

      {geo && latest ? (
        <>
          <p className="text-paragraph-xs text-text-sub-600">
            Última verificação: {formatDateTime(latest.ranAt)} · {latest.total} prompts no Gemini{latest.verifiable ? " com busca do Google" : " (sem busca do Google: citações não verificáveis)"}. Mede só os prompts cadastrados, não toda a atividade
            das IAs.
          </p>

          <section aria-label="Indicadores de visibilidade em IA" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard
              label="Visibilidade"
              href="#prompts"
              value={`${Math.round(rate!)}%`}
              trend={<TrendIndicator current={rate} previous={prevRate} suffix="vs verificação anterior" />}
              hint={`Marca citada em ${latest.mentioned} de ${latest.total} respostas`}
              info={{ title: "Visibilidade", text: "Porcentagem das respostas do Gemini aos seus prompts em que o nome da marca aparece no texto. Mede só os prompts cadastrados." }}
            />
            <MetricCard
              label="Citações verificadas"
              href="#prompts"
              value={latest.verifiable ? latest.cited : "—"}
              hint={latest.verifiable ? `Seu domínio entre as fontes em ${latest.cited} de ${latest.verifiable}` : "Busca do Google indisponível no plano atual do Gemini"}
              info={{ title: "Citações verificadas", text: "Respostas em que o seu domínio aparece entre as fontes que o Gemini consultou na busca. É diferente de só mencionar o nome." }}
            />
            <MetricCard
              label="Concorrente líder"
              href="#prompts"
              value={sov.length > 1 ? sov[1].label : "—"}
              hint={sov.length > 1 ? `Aparece em ${sov[1].sub} respostas` : "Cadastre concorrentes para comparar"}
              info={{ title: "Concorrente líder", text: "O concorrente cadastrado que mais aparece nas mesmas respostas." }}
            />
            <MetricCard
              label="Verificações"
              href="#config"
              value={geo.batches.length}
              hint={`${geo.prompts.length} prompts monitorados`}
              info={{ title: "Verificações", text: "Quantas vezes você rodou a verificação. Cada uma consulta todos os prompts." }}
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader title="Evolução da visibilidade" description="% de respostas que mencionam a marca, por verificação." />
              <div className="p-5">
                {series.length >= 2 ? (
                  <TimeSeriesChart current={series} unit="score" label="Visibilidade (%)" height={240} />
                ) : (
                  <ChartEmptyState title="Rode mais uma verificação" className="h-56">
                    O gráfico precisa de pelo menos dois dias com verificação para mostrar a evolução.
                  </ChartEmptyState>
                )}
              </div>
            </Card>
            <Card>
              <CardHeader title="Marca x concorrentes" description="Em quantas respostas cada nome aparece (última verificação)." />
              <div className="p-5">
                {sov.length > 1 ? (
                  <ComparisonChart items={sov} />
                ) : (
                  <ChartEmptyState title="Sem concorrentes" className="h-56">
                    Cadastre concorrentes na configuração para comparar quem as IAs citam.
                  </ChartEmptyState>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Por mecanismo de IA" description="Cada mecanismo só aparece quando existe coleta real." />
            <ul className="divide-y divide-stroke-soft-200 px-5 pb-3 pt-2 text-paragraph-sm">
              <li className="flex items-center justify-between py-2.5">
                <span className="text-text-strong-950">Gemini{latest.verifiable ? " (com busca do Google)" : ""}</span>
                <span className="tabular-nums text-text-strong-950">{Math.round(rate!)}%{latest.verifiable ? ` · ${latest.cited} citações` : ""}</span>
              </li>
              {["ChatGPT", "Perplexity", "Claude"].map((n) => (
                <li key={n} className="flex items-center justify-between py-2.5 text-text-sub-600">
                  {n}
                  <Badge>Não conectado</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card id="prompts">
            <CardHeader title="Resultado por prompt" description="Abra um prompt para ver a resposta e as fontes consultadas." />
            <ul className="divide-y divide-stroke-soft-200 px-4 pb-3 pt-2 sm:px-5">
              {latest.results.map((r) => (
                <li key={`${r.promptId}-${r.prompt}`}>
                  <details className="group py-3">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 text-label-sm text-text-strong-950">{r.prompt}</span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={r.mentioned ? "success" : "neutral"}>{r.mentioned ? "Marca citada" : "Marca ausente"}</Badge>
                        {r.cited !== null && <Badge tone={r.cited ? "success" : "neutral"}>{r.cited ? "Domínio nas fontes" : "Fora das fontes"}</Badge>}
                        {r.competitors.map((c) => (
                          <Badge key={c} tone="warning">{c}</Badge>
                        ))}
                      </span>
                    </summary>
                    <div className="mt-3 space-y-3 rounded-xl bg-bg-weak-50 p-4">
                      <p className="whitespace-pre-line text-paragraph-sm text-text-strong-950">{r.answer}</p>
                      {r.sources.length > 0 && (
                        <div>
                          <p className="mb-1 text-label-xs uppercase tracking-wide text-text-soft-400">Fontes consultadas</p>
                          <ul className="flex flex-wrap gap-1.5">
                            {r.sources.map((s, i) => (
                              <li key={i}>
                                <a href={s.uri} target="_blank" rel="noreferrer" className="rounded-md bg-bg-white-0 px-2 py-1 text-paragraph-xs text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200 hover:text-text-strong-950">
                                  {s.title || "fonte"}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : (
        !loadError && (
          <Card>
            <CardHeader
              title="Visibilidade em IA"
              description="Descubra se o Gemini cita a sua marca quando alguém pergunta sobre o seu mercado."
            />
            <div className="px-5 pb-5 pt-3">
              <ol className="mb-2 grid gap-3 text-paragraph-sm text-text-sub-600 sm:grid-cols-3">
                <li><span className="text-label-sm text-text-strong-950">1. Configure</span><br />Nome da marca e concorrentes.</li>
                <li><span className="text-label-sm text-text-strong-950">2. Cadastre prompts</span><br />Perguntas que um cliente faria. O Gemini pode sugerir.</li>
                <li><span className="text-label-sm text-text-strong-950">3. Verifique</span><br />Consultamos o Gemini com busca do Google e medimos menções e fontes.</li>
              </ol>
              {!viewer.owner && <p className="text-paragraph-sm text-text-sub-600">Nenhuma verificação foi feita ainda para este site.</p>}
            </div>
          </Card>
        )
      )}

      {viewer.owner && geo && (
        <Card id="config">
          <CardHeader title="Configuração" description="Marca, concorrentes e prompts desta verificação." />
          <div className="p-5">
            <GeoManager siteId={id} configured={geo.configured} initial={geo.settings} prompts={geo.prompts} />
          </div>
        </Card>
      )}
        </div>
      </details>
    </SiteWorkspace>
  );
}
