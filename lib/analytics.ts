import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

// Rastreio próprio de visitas, sem cookies: o visitante é um hash de IP + navegador + dia,
// que não permite reconhecer a pessoa de um dia para o outro nem guarda o IP.

let ensured = false;
export async function ensureAnalyticsTable() {
  if (ensured) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS pageviews (
    id bigserial PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    path text NOT NULL,
    device text NOT NULL,
    referrer text,
    country text,
    visitor text NOT NULL,
    at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS pageviews_site_at ON pageviews (site_id, at)`);
  ensured = true;
}

export function visitorHash(ip: string, ua: string, siteId: string, now = new Date()): string {
  const day = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return createHash("sha256").update(`${ip}|${ua}|${siteId}|${day}|${process.env.NEXTAUTH_SECRET ?? ""}`).digest("hex").slice(0, 32);
}

export function deviceFromWidth(w: number): "desktop" | "mobile" | "tablet" {
  return w < 768 ? "mobile" : w < 1100 ? "tablet" : "desktop";
}

const TZ = sql.raw("'America/Sao_Paulo'");
type Row = Record<string, unknown>;
const rows = (r: unknown) => r as Row[];

export async function loadAnalytics(siteId: string, days: number) {
  await ensureAnalyticsTable();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [daily, pages, devices, referrers, countries, months] = await Promise.all([
    db.execute(sql`SELECT to_char((at AT TIME ZONE ${TZ})::date, 'YYYY-MM-DD') AS d, count(*)::int AS views, count(DISTINCT visitor)::int AS visitors
      FROM pageviews WHERE site_id = ${siteId} AND at >= ${since}::timestamptz GROUP BY 1 ORDER BY 1`),
    db.execute(sql`SELECT path AS label, count(DISTINCT visitor)::int AS n FROM pageviews
      WHERE site_id = ${siteId} AND at >= ${since}::timestamptz GROUP BY 1 ORDER BY 2 DESC LIMIT 10`),
    db.execute(sql`SELECT device AS label, count(DISTINCT visitor)::int AS n FROM pageviews
      WHERE site_id = ${siteId} AND at >= ${since}::timestamptz GROUP BY 1 ORDER BY 2 DESC`),
    db.execute(sql`SELECT COALESCE(referrer, 'Direto') AS label, count(DISTINCT visitor)::int AS n FROM pageviews
      WHERE site_id = ${siteId} AND at >= ${since}::timestamptz GROUP BY 1 ORDER BY 2 DESC LIMIT 10`),
    db.execute(sql`SELECT COALESCE(country, '??') AS label, count(DISTINCT visitor)::int AS n FROM pageviews
      WHERE site_id = ${siteId} AND at >= ${since}::timestamptz GROUP BY 1 ORDER BY 2 DESC LIMIT 10`),
    db.execute(sql`SELECT to_char(m, 'YYYY-MM') AS month, sum(v)::int AS visitors, sum(views)::int AS views FROM (
        SELECT date_trunc('month', at AT TIME ZONE ${TZ}) AS m, (at AT TIME ZONE ${TZ})::date AS d,
               count(DISTINCT visitor) AS v, count(*) AS views
        FROM pageviews WHERE site_id = ${siteId} AND at >= now() - interval '12 months' GROUP BY 1, 2) t
      GROUP BY m ORDER BY m DESC`),
  ]);

  const d = rows(daily).map((r) => ({ date: String(r.d), views: Number(r.views), visitors: Number(r.visitors) }));
  const list = (r: unknown) => rows(r).map((x) => ({ label: String(x.label), n: Number(x.n) }));
  return {
    daily: d,
    visitors: d.reduce((a, b) => a + b.visitors, 0),
    views: d.reduce((a, b) => a + b.views, 0),
    pages: list(pages),
    devices: list(devices),
    referrers: list(referrers),
    countries: list(countries),
    months: rows(months).map((r) => ({ month: String(r.month), visitors: Number(r.visitors), views: Number(r.views) })),
  };
}
