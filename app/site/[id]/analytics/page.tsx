import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sites } from "@/db/schema";
import AppShell from "@/components/AppShell";
import CopyBox from "@/components/CopyBox";
import { Card, CardHeader } from "@/components/ui/Card";
import { Page, Segmented } from "@/components/ui/Page";
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

function countryName(code: string) {
  if (code === "??") return "Desconhecido";
  try {
    return new Intl.DisplayNames(["pt-BR"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function Chart({ data }: { data: { date: string; views: number; visitors: number }[] }) {
  if (data.length < 2) return <p className="py-10 text-center text-[13px] text-muted-foreground">Ainda não há dias suficientes para o gráfico.</p>;
  const w = 720;
  const h = 150;
  const max = Math.max(...data.map((d) => d.views), 1);
  const pts = (key: "views" | "visitors") =>
    data.map((d, i) => `${(i / (data.length - 1)) * w},${h - (d[key] / max) * (h - 10) - 2}`).join(" ");
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full" preserveAspectRatio="none" role="img" aria-label="Visitas por dia">
        <polyline points={pts("views")} fill="none" stroke="hsl(0 0% 70%)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        <polyline points={pts("visitors")} fill="none" stroke="hsl(0 0% 9%)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{data[0].date.split("-").reverse().slice(0, 2).join("/")}</span>
        <span className="flex gap-3">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-foreground" />Visitantes</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 bg-border" />Visualizações</span>
        </span>
        <span>{data[data.length - 1].date.split("-").reverse().slice(0, 2).join("/")}</span>
      </div>
    </div>
  );
}

function Ranking({ title, items, format }: { title: string; items: { label: string; n: number }[]; format?: (l: string) => string }) {
  const max = Math.max(...items.map((i) => i.n), 1);
  return (
    <Card>
      <CardHeader title={title} />
      <div className="space-y-1 p-5 pt-3">
        {items.length === 0 && <p className="text-[13px] text-muted-foreground">Sem dados no período.</p>}
        {items.map((i) => (
          <div key={i.label} className="relative flex h-8 items-center justify-between overflow-hidden rounded-md px-2.5 text-[13px]">
            <span className="absolute inset-y-0 left-0 rounded-md bg-secondary" style={{ width: `${(i.n / max) * 100}%` }} />
            <span className="relative truncate">{format ? format(i.label) : i.label}</span>
            <span className="relative ml-3 tabular-nums text-muted-foreground">{num(i.n)}</span>
          </div>
        ))}
      </div>
    </Card>
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

  return (
    <AppShell activeSiteId={id}>
      <Page
        width="max-w-5xl"
        title={
          <span className="flex items-center gap-2">
            <Link href={`/site/${id}`} aria-label="Voltar à análise" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            Visitas · {site.name}
          </span>
        }
        subtitle="Quantas pessoas visitam o site, quais páginas e de que aparelho. Sem cookies."
        actions={
          <Segmented
            label="Período"
            items={PERIODS.map((x) => ({ label: x.label, href: `/site/${id}/analytics?p=${x.value}`, active: period === x.value }))}
          />
        }
      >
        {loadError && (
          <Card className="border-destructive/40 p-5 text-[13px]">
            <p className="font-medium text-destructive">Não foi possível carregar as visitas.</p>
            {viewer.owner && <p className="mt-1 break-all text-xs text-muted-foreground">{loadError}</p>}
          </Card>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Visitantes", a.visitors],
            ["Visualizações de página", a.views],
            ["Páginas por visitante", a.visitors ? (a.views / a.visitors).toFixed(1) : "—"],
          ].map(([label, v]) => (
            <Card key={String(label)} className="px-5 py-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight">{typeof v === "number" ? num(v) : v}</p>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader title="Visitas por dia" />
          <div className="p-5 pt-3">
            <Chart data={a.daily} />
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Ranking title="Páginas mais visitadas" items={a.pages} />
          <Ranking title="Aparelhos" items={a.devices} format={(l) => DEVICE[l] ?? l} />
          <Ranking title="De onde vêm" items={a.referrers} />
          <Ranking title="Países" items={a.countries} format={countryName} />
        </div>

        <Card className="overflow-hidden">
          <CardHeader title="Visitantes por mês" description="Últimos 12 meses. Quem volta em outro dia conta de novo." />
          <table className="mt-4 w-full text-left text-[13px]">
            <thead>
              <tr className="border-y border-border bg-secondary/60 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2">Mês</th>
                <th className="px-3 py-2">Visitantes</th>
                <th className="px-5 py-2 text-right">Visualizações</th>
              </tr>
            </thead>
            <tbody>
              {a.months.map((m) => (
                <tr key={m.month} className="border-b border-border last:border-b-0">
                  <td className="px-5 py-2.5">{MONTHS[Number(m.month.slice(5)) - 1]}/{m.month.slice(0, 4)}</td>
                  <td className="px-3 py-2.5 tabular-nums">{num(m.visitors)}</td>
                  <td className="px-5 py-2.5 text-right tabular-nums">{num(m.views)}</td>
                </tr>
              ))}
              {a.months.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-6 text-center text-muted-foreground">Nenhuma visita registrada ainda.</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        {viewer.owner && (
          <Card>
            <CardHeader title="Instalar no site" description="Faça uma vez por site e as visitas começam a aparecer aqui." />
            <div className="space-y-3 p-5 pt-3 text-[13px] text-muted-foreground">
              <p>
                No Framer: abra <b className="text-foreground">Site Settings › General › Custom Code</b>, cole o código abaixo em
                <b className="text-foreground"> End of {"<head>"} tag</b> e publique o site.
              </p>
              <CopyBox text={snippet} />
            </div>
          </Card>
        )}
      </Page>
    </AppShell>
  );
}
