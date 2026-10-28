import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sites } from "@/db/schema";
import SiteWorkspace from "@/components/site/SiteWorkspace";
import CopyBox from "@/components/CopyBox";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Page";
import { canViewSite, getAccessibleSiteIds, getViewer } from "@/lib/access";
import { loadAnalytics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const PERIODS = [
  { value: "7", label: "7 dias" },
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
];
const DEVICE: Record<string, string> = { desktop: "Computador", mobile: "Celular", tablet: "Tablet" };
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const num = (n: number) => n.toLocaleString("pt-BR");
const short = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".", ",")} mil` : String(n));
const dm = (d: string) => d.split("-").reverse().slice(0, 2).join("/");

function countryName(code: string) {
  if (code === "??") return "Desconhecido";
  try {
    return new Intl.DisplayNames(["pt-BR"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

// Gráfico em área: visitantes por dia (linha escura) sobre as visualizações (linha clara).
function AreaChart({ data }: { data: { date: string; views: number; visitors: number }[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center text-paragraph-sm text-text-sub-600">
        Ainda não há dias suficientes para o gráfico.
      </div>
    );
  }
  const w = 640;
  const h = 200;
  const max = Math.max(...data.map((d) => d.views), 1);
  const x = (i: number) => (i / (data.length - 1)) * w;
  const y = (v: number) => h - (v / max) * (h - 16) - 4;
  const line = (key: "views" | "visitors") => data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d[key])}`).join(" ");
  return (
    <div>
      <div className="relative">
        <span className="absolute left-0 top-0 text-paragraph-xs text-text-sub-600">{max}</span>
        <svg viewBox={`0 0 ${w} ${h}`} className="h-56 w-full" preserveAspectRatio="none" role="img" aria-label="Visitas por dia">
          <defs>
            <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(0 0% 9%)" stopOpacity="0.08" />
              <stop offset="100%" stopColor="hsl(0 0% 9%)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${line("visitors")} L${w},${h} L0,${h} Z`} fill="url(#fill)" />
          <path d={line("views")} fill="none" stroke="hsl(0 0% 78%)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />
          <path d={line("visitors")} fill="none" stroke="hsl(0 0% 9%)" strokeWidth="1.75" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-stroke-soft-200 pt-2 text-paragraph-xs text-text-sub-600">
        <span>{dm(data[0].date)}</span>
        <span className="flex gap-4">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-foreground" />Visitantes</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 border-t border-dashed border-muted-foreground" />Visualizações</span>
        </span>
        <span>{dm(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}

// Lista com barra de fundo proporcional, como o "Top pages" do Framer.
function Ranking({ title, items, format }: { title: string; items: { label: string; n: number }[]; format?: (l: string) => string }) {
  const max = Math.max(...items.map((i) => i.n), 1);
  return (
    <section>
      <h3 className="mb-3 text-paragraph-sm font-medium text-text-strong-950">{title}</h3>
      <div className="space-y-1">
        {items.length === 0 && <p className="text-paragraph-sm text-text-sub-600">Sem dados no período.</p>}
        {items.map((i) => (
          <div key={i.label} className="relative flex h-8 items-center justify-between overflow-hidden rounded-md px-2.5 text-paragraph-sm">
            <span className="absolute inset-y-0 left-0 rounded-md bg-bg-weak-50" style={{ width: `${Math.max((i.n / max) * 100, 4)}%` }} />
            <span className="relative truncate">{format ? format(i.label) : i.label}</span>
            <span className="relative ml-3 tabular-nums text-text-sub-600">{short(i.n)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function SiteAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { id } = await params;
  const { p } = await searchParams;
  const period = PERIODS.some((x) => x.value === p) ? p! : "30";

  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const [site] = await db.select().from(sites).where(eq(sites.id, id));
  const accessible = viewer.owner ? new Set<string>() : await getAccessibleSiteIds(viewer.email);
  if (!site || !canViewSite(viewer, site, accessible, site.id)) notFound();

  let loadError: string | null = null;
  let a: Awaited<ReturnType<typeof loadAnalytics>> = { daily: [], visitors: 0, views: 0, pages: [], devices: [], referrers: [], countries: [], months: [] };
  try {
    a = await loadAnalytics(id, Number(period));
  } catch (e) {
    loadError = e instanceof Error ? e.message : String(e);
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const snippet = `<script defer src="https://${host}/t.js" data-site="${id}"></script>`;
  const empty = a.views === 0;

  const kpis: [string, string][] = [
    ["Visitantes", num(a.visitors)],
    ["Visualizações", num(a.views)],
    ["Páginas por visita", a.visitors ? (a.views / a.visitors).toFixed(1).replace(".", ",") : "—"],
    ["Aparelho principal", a.devices[0] ? DEVICE[a.devices[0].label] ?? a.devices[0].label : "—"],
  ];

  return (
    <SiteWorkspace siteId={id} tab="analytics">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-paragraph-xs text-text-sub-600">Contagem própria, sem cookies. Só existe em sites com o código instalado.</p>
        <Segmented
          label="Período"
          items={PERIODS.map((x) => ({ label: x.label, href: `/site/${id}/analytics?p=${x.value}`, active: period === x.value }))}
        />
      </div>
        {loadError && (
          <Card className="border-error-base/40 p-4 text-paragraph-sm">
            <p className="font-medium text-error-base">Não foi possível carregar as visitas.</p>
            {viewer.owner && <p className="mt-1 break-all text-paragraph-xs text-text-sub-600">{loadError}</p>}
          </Card>
        )}

        <div className="grid grid-cols-2 gap-y-4 border-y border-stroke-soft-200 py-4 sm:grid-cols-4">
          {kpis.map(([label, value], i) => (
            <div key={label} className={`px-1 sm:px-5 ${i ? "sm:border-l sm:border-stroke-soft-200" : "sm:pl-0"}`}>
              <p className="text-paragraph-xs text-text-sub-600">{label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
            </div>
          ))}
        </div>

        {empty && !loadError && (
          <Card className="p-4 text-paragraph-sm text-text-sub-600">
            Ainda não há visitas neste período. A contagem só existe em sites com o código instalado; veja “Configurar” na página do site.
          </Card>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <section>
            <h3 className="mb-3 text-paragraph-sm font-medium text-text-strong-950">Visitas por dia</h3>
            <AreaChart data={a.daily} />
          </section>
          <Ranking title="Páginas mais visitadas" items={a.pages} />
        </div>

        <div className="grid gap-8 border-t border-stroke-soft-200 pt-6 md:grid-cols-3">
          <Ranking title="De onde vêm" items={a.referrers} />
          <Ranking title="Países" items={a.countries} format={countryName} />
          <Ranking title="Aparelhos" items={a.devices} format={(l) => DEVICE[l] ?? l} />
        </div>

        <section className="border-t border-stroke-soft-200 pt-6">
          <h3 className="mb-1 text-paragraph-sm font-medium text-text-strong-950">Visitantes por mês</h3>
          <p className="mb-3 text-paragraph-xs text-text-sub-600">Últimos 12 meses. Quem volta em outro dia conta de novo.</p>
          <table className="w-full text-left text-paragraph-sm">
            <thead>
              <tr className="border-y border-stroke-soft-200 bg-bg-weak-50 text-paragraph-xs font-medium uppercase tracking-wider text-text-sub-600">
                <th className="px-3 py-2">Mês</th>
                <th className="px-3 py-2">Visitantes</th>
                <th className="px-3 py-2 text-right">Visualizações</th>
              </tr>
            </thead>
            <tbody>
              {a.months.map((m) => (
                <tr key={m.month} className="border-b border-stroke-soft-200 last:border-b-0">
                  <td className="px-3 py-2.5">{MONTHS[Number(m.month.slice(5)) - 1]}/{m.month.slice(0, 4)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{num(m.visitors)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{num(m.views)}</td>
                </tr>
              ))}
              {a.months.length === 0 && (
                <tr><td colSpan={3} className="px-3 py-6 text-center text-text-sub-600">Nenhuma visita registrada ainda.</td></tr>
              )}
            </tbody>
          </table>
        </section>

        {viewer.owner && (
          <details className="rounded-md border border-stroke-soft-200 px-4 py-3 text-paragraph-sm text-text-sub-600">
            <summary className="cursor-pointer font-medium text-text-strong-950">Código de rastreio deste site</summary>
            <p className="mt-2">
              Só para sites que você pode editar. No Framer: Site Settings › General › Custom Code › End of {"<head>"} tag. Em sites de
              clientes, não instale sem autorização deles.
            </p>
            <div className="mt-2"><CopyBox text={snippet} /></div>
          </details>
        )}
    </SiteWorkspace>
  );
}
