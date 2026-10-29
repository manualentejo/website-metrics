import Link from "next/link";
import SiteWorkspace, { requireSite } from "@/components/site/SiteWorkspace";
import GeoManager from "@/components/site/GeoManager";
import GeoAuditPanel from "@/components/site/GeoAuditPanel";
import ScoreGauge from "@/components/ScoreGauge";
import { Card, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import MetricCard from "@/components/charts/MetricCard";
import TrendIndicator from "@/components/charts/TrendIndicator";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import ComparisonChart from "@/components/charts/ComparisonChart";
import ChartEmptyState from "@/components/charts/ChartEmptyState";
import { RiEyeLine, RiMedalLine, RiSwordLine, RiHistoryLine } from "@remixicon/react";
import { formatDateTime } from "@/lib/format";
import { ENGINES, engineLabel, engineStatus, getGeo } from "@/lib/geo";
import { getGeoAudits } from "@/lib/geoAudit";
import { dayKey } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

const pct = (a: number, b: number) => (b ? (a / b) * 100 : 0);

export default async function SiteGeoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> }) {
  const { id } = await params;
  const { v } = await searchParams;
  const { viewer, site } = await requireSite(id);

  let geo: Awaited<ReturnType<typeof getGeo>> | null = null;
  let loadError: string | null = null;
  try {
    geo = await getGeo(id, site.name);
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }
  const audits = await getGeoAudits(id).catch(() => []);
  const audit = audits[0];
  const auditSeries = [...audits].reverse().map((a) => ({ date: dayKey(a.ranAt), value: a.score }));
  const failing = audit?.checks.filter((c) => c.status === "fail").length ?? 0;

  const latest = geo?.batches[0];
  const previous = geo?.batches[1];
  const rate = latest ? pct(latest.mentioned, latest.total) : null;
  const prevRate = previous ? pct(previous.mentioned, previous.total) : null;
  const view = v === "preparo" ? "preparo" : "visibilidade";

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

  // Resultados agrupados por prompt: uma linha por pergunta, com o resultado de cada IA.
  const byPrompt = new Map<string, NonNullable<typeof latest>["results"]>();
  for (const r of latest?.results ?? []) byPrompt.set(r.prompt, [...(byPrompt.get(r.prompt) ?? []), r]);

  const tab = (key: string) => `/site/${id}/geo${key === "visibilidade" ? "" : `?v=${key}`}`;
  const sel = (on: boolean) => `block rounded-2xl bg-bg-white-0 p-4 shadow-regular-xs ring-1 ring-inset transition duration-200 hover:ring-stroke-sub-300 ${on ? "ring-2 ring-stroke-strong-950" : "ring-stroke-soft-200"}`;

  return (
    <SiteWorkspace siteId={id} tab="geo">
      {loadError && (
        <ChartEmptyState kind="error" title="Não foi possível carregar o GEO" className="h-32">
          {viewer.owner ? loadError : "Tente de novo em instantes."}
        </ChartEmptyState>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={tab("visibilidade")} className={sel(view === "visibilidade")} aria-current={view === "visibilidade" ? "page" : undefined}>
          <p className="text-label-xs uppercase tracking-wide text-text-soft-400">Visibilidade nas IAs</p>
          <div className="mt-2 flex items-center gap-4">
            <span className="text-title-h4 tabular-nums text-text-strong-950">{rate === null ? "—" : `${Math.round(rate)}%`}</span>
            <div className="min-w-0 text-paragraph-xs text-text-sub-600">
              {latest ? (
                <>
                  <p>das respostas citam a marca</p>
                  <p>Verificado em {formatDateTime(latest.ranAt)}</p>
                </>
              ) : (
                <p>Ainda não verificado. Configure os prompts e rode a primeira verificação.</p>
              )}
            </div>
          </div>
          <p className="mt-2 flex flex-wrap gap-1.5">
            {engineStatus().map((e) => (
              <Badge key={e.id} tone={e.connected ? "success" : "neutral"}>{e.label}{e.connected ? "" : " · desconectado"}</Badge>
            ))}
          </p>
        </Link>
        <Link href={tab("preparo")} className={sel(view === "preparo")} aria-current={view === "preparo" ? "page" : undefined}>
          <p className="text-label-xs uppercase tracking-wide text-text-soft-400">Preparo do site para IAs</p>
          <div className="mt-2 flex items-center gap-4">
            <ScoreGauge score={audit?.score ?? null} label="" size={64} />
            <div className="min-w-0 text-paragraph-xs text-text-sub-600">
              {audit ? (
                <>
                  <p className="text-label-sm text-text-strong-950">{audit.score >= 80 ? "Bem preparado" : audit.score >= 50 ? "Parcialmente preparado" : "Pouco preparado"}</p>
                  <p>{failing} {failing === 1 ? "item para corrigir" : "itens para corrigir"} · auditoria gratuita, sem IA</p>
                </>
              ) : (
                <p>Auditoria técnica gratuita, sem IA. Abra para rodar.</p>
              )}
            </div>
          </div>
        </Link>
      </div>

      {view === "preparo" ? (
        <>
          <Card>
            <CardHeader title="Seu site está pronto para as IAs?" description="GEO é fazer o ChatGPT, o Gemini e o Perplexity entenderem e citarem o seu site. Esta auditoria lê o site, sem usar IA e sem custo." />
            <div className="space-y-5 p-5">
              <GeoAuditPanel siteId={id} score={audit?.score ?? null} previousScore={audits[1]?.score ?? null} checks={audit?.checks ?? []} canRun={viewer.owner} />
              {auditSeries.length >= 2 && (
                <div>
                  <p className="mb-2 text-label-xs uppercase tracking-wide text-text-soft-400">Evolução da nota</p>
                  <TimeSeriesChart current={auditSeries} unit="score" label="Nota de preparo" height={180} tone="purple" />
                </div>
              )}
              {audit && <p className="text-paragraph-xs text-text-soft-400">Última auditoria: {formatDateTime(audit.ranAt)}. Mede o preparo técnico, não quantas vezes as IAs citam você.</p>}
            </div>
          </Card>
          <Card>
            <CardHeader title="Preciso de palavras-chave?" />
            <div className="space-y-2 px-5 pb-5 pt-2 text-paragraph-sm text-text-sub-600">
              <p>Não do jeito antigo. Quem usa IA faz perguntas completas, como “qual a melhor clínica de X na minha cidade?”. O que mais ajuda é:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>Escrever, no site, as respostas às perguntas que seus clientes fazem.</li>
                <li>Dizer com clareza quem você é, o que faz e onde atua.</li>
                <li>Manter as informações em código (dados estruturados), como a lista acima mostra.</li>
              </ul>
            </div>
          </Card>
        </>
      ) : (
        geo && (
          <>
            {latest && (
              <>
                <section aria-label="Indicadores de visibilidade" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Visibilidade"
                    icon={RiEyeLine}
                    tone="purple"
                    href="#prompts"
                    value={`${Math.round(rate!)}%`}
                    trend={<TrendIndicator current={rate} previous={prevRate} suffix="vs anterior" />}
                    hint={`Marca citada em ${latest.mentioned} de ${latest.total} respostas`}
                    info={{ title: "Visibilidade", text: "% das respostas das IAs aos seus prompts em que o nome da marca aparece. Soma todas as IAs consultadas. Mede só os prompts cadastrados." }}
                  />
                  <MetricCard
                    label="Citações verificadas"
                    icon={RiMedalLine}
                    tone="green"
                    href="#prompts"
                    value={latest.verifiable ? latest.cited : "—"}
                    hint={latest.verifiable ? `Seu domínio entre as fontes em ${latest.cited} de ${latest.verifiable}` : "Busca na web indisponível"}
                    info={{ title: "Citações verificadas", text: "Respostas em que o seu domínio aparece entre as fontes consultadas pela IA. É diferente de só mencionar o nome." }}
                  />
                  <MetricCard
                    label="Concorrente líder"
                    icon={RiSwordLine}
                    tone="orange"
                    href="#concorrentes"
                    value={sov.length > 1 ? sov[1].label : "—"}
                    hint={sov.length > 1 ? `Aparece em ${sov[1].sub} respostas` : "Cadastre concorrentes na configuração"}
                    info={{ title: "Concorrente líder", text: "O concorrente cadastrado que mais aparece nas mesmas respostas." }}
                  />
                  <MetricCard
                    label="Verificações"
                    icon={RiHistoryLine}
                    tone="blue"
                    href="#config"
                    value={geo.batches.length}
                    hint={`${geo.prompts.length} prompts monitorados`}
                    info={{ title: "Verificações", text: "Quantas vezes você rodou a verificação. Cada uma consulta todos os prompts em todas as IAs conectadas." }}
                  />
                </section>

                <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <Card>
                    <CardHeader title="Evolução da visibilidade" description="% de respostas que citam a marca, por verificação." />
                    <div className="p-5">
                      {series.length >= 2 ? (
                        <TimeSeriesChart current={series} unit="score" label="Visibilidade (%)" height={240} tone="purple" />
                      ) : (
                        <ChartEmptyState title="Rode mais uma verificação" className="h-56">Com pelo menos dois dias de verificação o gráfico mostra a evolução.</ChartEmptyState>
                      )}
                    </div>
                  </Card>
                  <Card id="concorrentes">
                    <CardHeader title="Marca x concorrentes" description="Em quantas respostas cada nome aparece." />
                    <div className="p-5">
                      {sov.length > 1 ? (
                        <ComparisonChart items={sov} />
                      ) : (
                        <ChartEmptyState title="Sem concorrentes" className="h-56">Cadastre concorrentes na configuração abaixo para comparar quem as IAs citam.</ChartEmptyState>
                      )}
                    </div>
                  </Card>
                </div>

                <Card>
                  <CardHeader title="Por IA" description="Cada IA só aparece quando existe conexão real." />
                  <ul className="divide-y divide-stroke-soft-200 px-5 pb-3 pt-2 text-paragraph-sm">
                    {ENGINES.map((e) => {
                      const s = latest.byEngine[e.id];
                      return (
                        <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                          <span className="text-text-strong-950">{e.label}</span>
                          {s ? (
                            <span className="tabular-nums text-text-strong-950">
                              {Math.round(pct(s.mentioned, s.total))}% citam a marca{s.verifiable ? ` · ${s.cited} citações` : ""}
                            </span>
                          ) : e.connected() ? (
                            <Badge>Sem dados na última verificação</Badge>
                          ) : (
                            <Badge>Não conectado</Badge>
                          )}
                        </li>
                      );
                    })}
                    {["Perplexity", "Claude"].map((n) => (
                      <li key={n} className="flex items-center justify-between py-2.5 text-text-sub-600">
                        {n}
                        <Badge>Em breve</Badge>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card id="prompts">
                  <CardHeader title="Resultado por prompt" description="Abra um prompt para ver a resposta de cada IA e as fontes." />
                  <ul className="divide-y divide-stroke-soft-200 px-4 pb-3 pt-2 sm:px-5">
                    {[...byPrompt.entries()].map(([prompt, list]) => (
                      <li key={prompt}>
                        <details className="group py-3">
                          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                            <span className="min-w-0 flex-1 text-label-sm text-text-strong-950">{prompt}</span>
                            <span className="flex flex-wrap items-center gap-1.5">
                              {list.map((r) => (
                                <Badge key={r.engine} tone={r.mentioned ? "success" : "neutral"}>
                                  {engineLabel(r.engine)}: {r.mentioned ? "cita" : "ausente"}
                                </Badge>
                              ))}
                              {[...new Set(list.flatMap((r) => r.competitors))].map((c) => (
                                <Badge key={c} tone="warning">{c}</Badge>
                              ))}
                            </span>
                          </summary>
                          <div className="mt-3 space-y-3">
                            {list.map((r) => (
                              <div key={r.engine} className="space-y-3 rounded-xl bg-bg-weak-50 p-4">
                                <p className="flex flex-wrap items-center gap-2 text-label-xs uppercase tracking-wide text-text-soft-400">
                                  {engineLabel(r.engine)}
                                  {r.cited !== null && <Badge tone={r.cited ? "success" : "neutral"}>{r.cited ? "Domínio nas fontes" : "Fora das fontes"}</Badge>}
                                </p>
                                <p className="whitespace-pre-line text-paragraph-sm text-text-strong-950">{r.answer}</p>
                                {r.sources.length > 0 && (
                                  <ul className="flex flex-wrap gap-1.5">
                                    {r.sources.map((s, i) => (
                                      <li key={i}>
                                        <a href={s.uri} target="_blank" rel="noreferrer" className="rounded-md bg-bg-white-0 px-2 py-1 text-paragraph-xs text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200 hover:text-text-strong-950">
                                          {s.title || "fonte"}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </details>
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}

            {viewer.owner ? (
              <details id="config" open={!latest} className="group rounded-2xl bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
                  <span>
                    <span className="block text-label-md text-text-strong-950">{latest ? "Configurar marca, concorrentes e prompts" : "Comece aqui: configure e verifique"}</span>
                    <span className="block text-paragraph-xs text-text-sub-600">Os prompts são perguntas que um cliente faria a uma IA, sem citar a sua marca.</span>
                  </span>
                  <span className="text-label-xs text-text-sub-600 group-open:hidden">Abrir</span>
                </summary>
                <div className="border-t border-stroke-soft-200 p-5">
                  <GeoManager siteId={id} configured={geo.configured} initial={geo.settings} prompts={geo.prompts} engines={engineStatus()} />
                </div>
              </details>
            ) : (
              !latest && <ChartEmptyState title="Nenhuma verificação feita ainda" className="h-40" />
            )}
          </>
        )
      )}
    </SiteWorkspace>
  );
}
