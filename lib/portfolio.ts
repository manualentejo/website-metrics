import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { reports } from "@/db/schema";
import { ensureAnalyticsTable } from "@/lib/analytics";
import { ensureGeoAuditTable } from "@/lib/geoAudit";
import { loadAlerts, visibleSites, type Alert } from "@/lib/insights";
import type { Viewer } from "@/lib/access";
import type { Status } from "@/lib/types";

// Camada de dados do Overview global e do Overview de cada site.
// Fontes reais: relatórios Lighthouse (laboratório, computador) e a contagem própria de visitas.
// Não existem (ainda) Search Console nem monitoramento de prompts de IA: esses indicadores
// saem como "não conectado" e nunca recebem números.

export const PERIODS = [7, 28, 90] as const;
export type Period = (typeof PERIODS)[number];
export type MetricKey = "seo" | "performance" | "visits";

export interface Point {
  date: string;
  value: number | null;
}
export interface SeriesPair {
  current: Point[];
  previous: Point[];
}

export interface SiteSummary {
  id: string;
  name: string;
  url: string;
  status: Status;
  seo: number | null;
  performance: number | null;
  seoDelta: number | null;
  performanceDelta: number | null;
  geo: number | null;
  visits: number | null; // null = site sem código de rastreio / sem dados no período
  lastAudit: Date | null;
}

export interface Mover {
  siteId: string;
  siteName: string;
  delta: number;
  from: number;
  to: number;
}

export interface ActivityItem {
  id: string;
  at: Date;
  siteId: string;
  siteName: string;
  kind: "audit" | "issue" | "site";
  title: string;
  detail: string;
  href: string;
}

export interface WeeklyInsight {
  key: "improvement" | "regression" | "priority" | "opportunity" | "next";
  label: string;
  text: string;
  href: string | null;
  evidence: string | null;
}

export const dayKey = (d: Date) => new Date(d.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
const addDays = (key: string, n: number) => {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

type Rep = typeof reports.$inferSelect;

/** Nota média por dia: cada site contribui com a análise mais recente até aquele dia (carregada adiante). */
function scoreSeries(bySite: Map<string, Rep[]>, key: "seoScore" | "performanceScore", endKey: string, n: number): Point[] {
  const out: Point[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const day = addDays(endKey, -i);
    const vals: number[] = [];
    for (const list of bySite.values()) {
      let latest: number | null = null;
      for (const r of list) {
        if (dayKey(r.ranAt) > day) break;
        if (typeof r[key] === "number") latest = r[key];
      }
      if (latest !== null) vals.push(latest);
    }
    out.push({ date: day, value: mean(vals) });
  }
  return out;
}

export function lastValue(points: Point[]): number | null {
  for (let i = points.length - 1; i >= 0; i--) if (points[i].value !== null) return points[i].value;
  return null;
}

async function loadVisits(ids: string[], days: number, endKey: string) {
  if (!ids.length) return { cur: [] as Point[], prev: [] as Point[], perSite: new Map<string, number>() };
  await ensureAnalyticsTable();
  const list = sql.join(ids.map((i) => sql`${i}::uuid`), sql`, `);
  const since = `${addDays(endKey, -(days * 2 - 1))}T03:00:00Z`;
  const tz = sql.raw("'America/Sao_Paulo'");
  const [daily, perSite] = await Promise.all([
    db.execute(sql`SELECT to_char((at AT TIME ZONE ${tz})::date, 'YYYY-MM-DD') AS d, count(*)::int AS n
      FROM pageviews WHERE site_id IN (${list}) AND at >= ${since}::timestamptz GROUP BY 1`),
    db.execute(sql`SELECT site_id::text AS id, count(*)::int AS n FROM pageviews
      WHERE site_id IN (${list}) AND at >= ${`${addDays(endKey, -(days - 1))}T03:00:00Z`}::timestamptz GROUP BY 1`),
  ]);
  const byDay = new Map((daily as unknown as { d: string; n: number }[]).map((r) => [String(r.d), Number(r.n)]));
  const mk = (end: string): Point[] =>
    Array.from({ length: days }, (_, i) => {
      const d = addDays(end, -(days - 1 - i));
      return { date: d, value: byDay.get(d) ?? 0 };
    });
  return {
    cur: mk(endKey),
    prev: mk(addDays(endKey, -days)),
    perSite: new Map((perSite as unknown as { id: string; n: number }[]).map((r) => [String(r.id), Number(r.n)])),
  };
}

/** Nota GEO técnica (auditoria sem IA) por site, com a série média do portfólio. */
async function loadGeo(ids: string[], days: number, endKey: string, names: Map<string, string>) {
  if (!ids.length) return null;
  await ensureGeoAuditTable();
  const list = sql.join(ids.map((i) => sql`${i}::uuid`), sql`, `);
  const res = (await db.execute(sql`SELECT site_id::text AS id, ran_at AS at, score FROM geo_audits WHERE site_id IN (${list}) AND NOT (score = 0 AND jsonb_array_length(checks) = 1) ORDER BY ran_at`)) as unknown as { id: string; at: string; score: number }[];
  if (!res.length) return null;
  const bySite = new Map<string, { day: string; score: number }[]>();
  for (const r of res) {
    const arr = bySite.get(String(r.id)) ?? [];
    arr.push({ day: dayKey(new Date(String(r.at))), score: Number(r.score) });
    bySite.set(String(r.id), arr);
  }
  const series = (end: string): Point[] =>
    Array.from({ length: days }, (_, i) => {
      const day = addDays(end, -(days - 1 - i));
      const vals: number[] = [];
      for (const arr of bySite.values()) {
        let v: number | null = null;
        for (const b of arr) {
          if (b.day > day) break;
          v = b.score;
        }
        if (v !== null) vals.push(v);
      }
      return { date: day, value: mean(vals) };
    });
  const cur = series(endKey);
  const prev = series(addDays(endKey, -days));
  const sites = [...bySite.entries()].map(([id, arr]) => ({ id, name: names.get(id) ?? "", score: arr[arr.length - 1].score }));
  return {
    score: lastValue(cur),
    delta: lastValue(cur) !== null && lastValue(prev) !== null ? lastValue(cur)! - lastValue(prev)! : null,
    sites,
    series: { current: cur, previous: prev } as SeriesPair,
  };
}

export async function loadPortfolio(viewer: Viewer, opts: { days: Period; siteIds?: string[] | null }) {
  const { days } = opts;
  const all = await visibleSites(viewer);
  const selected = opts.siteIds?.length ? all.filter((s) => opts.siteIds!.includes(s.id)) : all;
  const ids = selected.map((s) => s.id);
  const endKey = dayKey(new Date());

  const repRows = ids.length
    ? await db
        .select()
        .from(reports)
        .where(and(inArray(reports.siteId, ids), eq(reports.strategy, "desktop"), isNull(reports.error)))
        .orderBy(asc(reports.ranAt))
        .limit(6000)
    : [];
  const bySite = new Map<string, Rep[]>(ids.map((i) => [i, []]));
  for (const r of repRows) bySite.get(r.siteId)?.push(r);

  const seoCur = scoreSeries(bySite, "seoScore", endKey, days);
  const seoPrev = scoreSeries(bySite, "seoScore", addDays(endKey, -days), days);
  const perfCur = scoreSeries(bySite, "performanceScore", endKey, days);
  const perfPrev = scoreSeries(bySite, "performanceScore", addDays(endKey, -days), days);

  let visits: Awaited<ReturnType<typeof loadVisits>> | null = null;
  let visitsError: string | null = null;
  try {
    visits = await loadVisits(ids, days, endKey);
  } catch (e) {
    visitsError = e instanceof Error ? e.message : String(e);
  }
  const trackedIds = new Set(visits?.perSite.keys() ?? []);
  let geo: Awaited<ReturnType<typeof loadGeo>> = null;
  try {
    geo = await loadGeo(ids, days, endKey, new Map(selected.map((s) => [s.id, s.name])));
  } catch {
    geo = null; // sem GEO não derruba o Overview
  }

  const rows: SiteSummary[] = selected.map((s) => {
    const list = bySite.get(s.id) ?? [];
    const last = list[list.length - 1];
    const before = list[list.length - 2];
    const d = (a?: number | null, b?: number | null) => (typeof a === "number" && typeof b === "number" ? a - b : null);
    return {
      id: s.id,
      name: s.name,
      url: s.url,
      status: s.status as Status,
      seo: last?.seoScore ?? null,
      performance: last?.performanceScore ?? null,
      seoDelta: d(last?.seoScore, before?.seoScore),
      performanceDelta: d(last?.performanceScore, before?.performanceScore),
      geo: geo?.sites.find((g) => g.id === s.id)?.score ?? null,
      visits: trackedIds.has(s.id) ? (visits?.perSite.get(s.id) ?? 0) : null,
      lastAudit: last?.ranAt ?? null,
    };
  });

  const alerts = (await loadAlerts(viewer)).filter((a) => ids.includes(a.siteId));
  const problems = alerts.filter((a) => a.severity !== "good");
  const critical = problems.filter((a) => a.severity === "critical");

  const seoRows = rows.filter((r) => r.seo !== null);
  const distribution = [
    { label: "Bom (90–100)", tone: "success" as const, count: seoRows.filter((r) => r.seo! >= 90).length },
    { label: "Médio (50–89)", tone: "warning" as const, count: seoRows.filter((r) => r.seo! >= 50 && r.seo! < 90).length },
    { label: "Ruim (0–49)", tone: "error" as const, count: seoRows.filter((r) => r.seo! < 50).length },
  ];

  const movers = (key: "seoDelta" | "performanceDelta", from: "seo" | "performance"): { up: Mover[]; down: Mover[] } => {
    const m = rows
      .filter((r) => r[key] !== null && r[key] !== 0 && r[from] !== null)
      .map((r) => ({ siteId: r.id, siteName: r.name, delta: r[key]!, from: r[from]! - r[key]!, to: r[from]! }));
    return {
      up: m.filter((x) => x.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 3),
      down: m.filter((x) => x.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 3),
    };
  };
  const seoMovers = movers("seoDelta", "seo");
  const perfMovers = movers("performanceDelta", "performance");

  // Atividade: só eventos que de fato existem no banco.
  const activity: ActivityItem[] = [];
  const nameOf = new Map(selected.map((s) => [s.id, s.name]));
  const seenAudit = new Set<string>();
  for (const r of [...repRows].reverse()) {
    const k = `${r.siteId}-${dayKey(r.ranAt)}`;
    if (seenAudit.has(k)) continue;
    seenAudit.add(k);
    activity.push({
      id: `a-${r.id}`,
      at: r.ranAt,
      siteId: r.siteId,
      siteName: nameOf.get(r.siteId) ?? "",
      kind: "audit",
      title: "Auditoria concluída",
      detail: `Desempenho ${Math.round(r.performanceScore ?? 0)} · SEO ${Math.round(r.seoScore ?? 0)} (computador)`,
      href: `/site/${r.siteId}/history`,
    });
    if (seenAudit.size >= 12) break;
  }
  for (const s of selected) {
    activity.push({
      id: `s-${s.id}`,
      at: s.createdAt,
      siteId: s.id,
      siteName: s.name,
      kind: "site",
      title: "Website adicionado",
      detail: s.url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      href: `/site/${s.id}`,
    });
  }
  for (const a of problems.slice(0, 12)) {
    activity.push({
      id: `i-${a.siteId}-${a.title}-${a.strategy}`,
      at: a.at,
      siteId: a.siteId,
      siteName: a.siteName,
      kind: "issue",
      title: "Problema identificado",
      detail: a.title,
      href: a.href,
    });
  }
  activity.sort((x, y) => y.at.getTime() - x.at.getTime());

  // Resumo semanal derivado só dos números acima (sem IA, sem causas supostas).
  const best = [...seoMovers.up.map((m) => ({ ...m, what: "SEO" })), ...perfMovers.up.map((m) => ({ ...m, what: "Desempenho" }))].sort(
    (a, b) => b.delta - a.delta
  )[0];
  const worst = [...seoMovers.down.map((m) => ({ ...m, what: "SEO" })), ...perfMovers.down.map((m) => ({ ...m, what: "Desempenho" }))].sort(
    (a, b) => a.delta - b.delta
  )[0];
  const top = problems[0];
  const lowSeo = [...seoRows].sort((a, b) => a.seo! - b.seo!)[0];
  let opportunity: { title: string; siteId: string } | null = null;
  if (lowSeo) {
    const lastRep = bySite.get(lowSeo.id)?.slice(-1)[0];
    const f = [...(lastRep?.failedSeoAudits ?? [])].sort((a, b) => b.weight - a.weight)[0];
    if (f) opportunity = { title: f.title, siteId: lowSeo.id };
  }
  const insights: WeeklyInsight[] = [
    best
      ? {
          key: "improvement",
          label: "Principal melhoria",
          text: `${best.siteName}: ${best.what} subiu ${Math.round(best.delta)} pontos (${Math.round(best.from)} → ${Math.round(best.to)}) entre as duas últimas auditorias.`,
          href: `/site/${best.siteId}/${best.what === "SEO" ? "seo" : "performance"}`,
          evidence: "Lighthouse · computador",
        }
      : { key: "improvement", label: "Principal melhoria", text: "Nenhuma nota subiu entre as duas últimas auditorias.", href: null, evidence: null },
    worst
      ? {
          key: "regression",
          label: "Principal regressão",
          text: `${worst.siteName}: ${worst.what} caiu ${Math.abs(Math.round(worst.delta))} pontos (${Math.round(worst.from)} → ${Math.round(worst.to)}).`,
          href: `/site/${worst.siteId}/${worst.what === "SEO" ? "seo" : "performance"}`,
          evidence: "Lighthouse · computador",
        }
      : { key: "regression", label: "Principal regressão", text: "Nenhuma nota caiu entre as duas últimas auditorias.", href: null, evidence: null },
    top
      ? {
          key: "priority",
          label: "Problema prioritário",
          text: `${top.siteName}: ${top.title}. ${top.detail}`,
          href: top.href,
          evidence: `Alerta de ${top.category}`,
        }
      : { key: "priority", label: "Problema prioritário", text: "Nenhum alerta aberto.", href: null, evidence: null },
    opportunity
      ? {
          key: "opportunity",
          label: "Oportunidade",
          text: `${nameOf.get(opportunity.siteId)} tem a menor nota de SEO. Auditoria reprovada de maior peso: “${opportunity.title}”.`,
          href: `/site/${opportunity.siteId}/performance?cat=seo`,
          evidence: "Auditorias de SEO do Lighthouse",
        }
      : { key: "opportunity", label: "Oportunidade", text: "Sem auditorias de SEO reprovadas nos dados atuais.", href: null, evidence: null },
    top
      ? { key: "next", label: "Próxima ação", text: `Abrir a análise de ${top.siteName} e corrigir “${top.title}”.`, href: top.href, evidence: null }
      : { key: "next", label: "Próxima ação", text: "Nada urgente. Rode uma nova auditoria depois de publicar mudanças.", href: null, evidence: null },
  ];

  const lastUpdate = repRows.length ? repRows[repRows.length - 1].ranAt : null;
  const hasVisitData = !!visits && trackedIds.size > 0;

  return {
    days,
    allSites: all.map((s) => ({ id: s.id, name: s.name })),
    selectedIds: ids,
    lastUpdate,
    kpi: {
      total: selected.length,
      live: selected.filter((s) => s.status === "no_ar").length,
      seo: lastValue(seoCur),
      seoDelta: lastValue(seoCur) !== null && lastValue(seoPrev) !== null ? lastValue(seoCur)! - lastValue(seoPrev)! : null,
      seoSpark: seoCur.map((p) => p.value),
      critical: critical.length,
      problems: problems.length,
    },
    series: {
      seo: { current: seoCur, previous: seoPrev } as SeriesPair,
      performance: { current: perfCur, previous: perfPrev } as SeriesPair,
      visits: hasVisitData ? ({ current: visits!.cur, previous: visits!.prev } as SeriesPair) : null,
    },
    visitsError,
    geo,
    trackedSites: trackedIds.size,
    rows,
    distribution,
    seoMovers,
    perfMovers,
    attention: problems.slice(0, 8) as Alert[],
    insights,
    activity: activity.slice(0, 10),
  };
}

export type PortfolioData = Awaited<ReturnType<typeof loadPortfolio>>;

/** Maiores falhas de SEO da última auditoria de um site, por peso. */
export async function loadSiteReports(siteId: string, strategy: "desktop" | "mobile" = "desktop", limit = 104) {
  return db
    .select()
    .from(reports)
    .where(and(eq(reports.siteId, siteId), eq(reports.strategy, strategy), isNull(reports.error)))
    .orderBy(desc(reports.ranAt))
    .limit(limit);
}
