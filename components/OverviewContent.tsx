import Link from "next/link";
import ScoreGauge from "@/components/ScoreGauge";
import StatusSelect from "@/components/StatusSelect";
import AddSiteBar from "@/components/AddSiteBar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Page, Segmented, EmptyState } from "@/components/ui/Page";
import type { ReactNode } from "react";
import { RiSettings3Line } from "@remixicon/react";
import { formatDateTime } from "@/lib/format";
import type { OverviewRow } from "@/lib/overview";
import type { Status } from "@/lib/types";

function Bar({ value }: { value: number | null }) {
  const color = value === null ? "bg-border" : value >= 90 ? "bg-success" : value >= 50 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1 w-16 overflow-hidden rounded-sm bg-secondary">
        <div className={`h-full ${color}`} style={{ width: `${value ?? 0}%` }} />
      </div>
      <span className="w-6 text-[13px] tabular-nums text-foreground">{value === null ? "—" : Math.round(value)}</span>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

export const FILTERS = [
  { value: "", label: "Todos" },
  { value: "no_ar", label: "No ar" },
  { value: "em_andamento", label: "Em andamento" },
];

export function SitesTable({
  rows,
  owner,
  folderNames,
  basePath,
  statusFilter,
  title = "Sites monitorados",
}: {
  rows: OverviewRow[];
  owner: boolean;
  folderNames: Record<string, string>;
  basePath: string;
  statusFilter?: string;
  title?: string;
}) {
  const filtered = statusFilter ? rows.filter((r) => r.status === statusFilter) : rows;
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={title}
        description="Notas do computador, nosso foco. A coluna Celular mostra o desempenho no celular."
        action={
          <Segmented
            label="Filtrar por status"
            items={FILTERS.map((f) => ({
              label: f.label,
              href: f.value ? `${basePath}?status=${f.value}` : basePath,
              active: (statusFilter ?? "") === f.value,
            }))}
          />
        }
      />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px] text-left">
          <thead>
            <tr className="border-y border-border bg-secondary/60 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-2">Site</th>
              <th className="px-3 py-2">Desempenho</th>
              <th className="px-3 py-2">Acessib.</th>
              <th className="px-3 py-2">Boas práticas</th>
              <th className="px-3 py-2">SEO</th>
              <th className="px-3 py-2">Celular</th>
              <th className="px-5 py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((site) => (
              <tr key={site.id} className="border-b border-border last:border-b-0 hover:bg-secondary/40">
                <td className="px-5 py-2.5">
                  <Link href={`/site/${site.id}`} className="flex items-center gap-3">
                    <ScoreGauge score={site.desktop?.performanceScore ?? null} label="" size={40} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-foreground">{site.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {site.folderId && folderNames[site.folderId] ? `${folderNames[site.folderId]} · ` : ""}
                        {site.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-2.5"><Bar value={site.desktop?.performanceScore ?? null} /></td>
                <td className="px-3 py-2.5"><Bar value={site.desktop?.accessibilityScore ?? null} /></td>
                <td className="px-3 py-2.5"><Bar value={site.desktop?.bestPracticesScore ?? null} /></td>
                <td className="px-3 py-2.5"><Bar value={site.desktop?.seoScore ?? null} /></td>
                <td className="px-3 py-2.5"><Bar value={site.mobile?.performanceScore ?? null} /></td>
                <td className="px-5 py-2.5">
                  <div className="flex items-center justify-end gap-2">
                    <StatusSelect siteId={site.id} status={site.status as Status} readOnly={!owner} />
                    {owner && (
                      <Link
                        href={`/site/${site.id}?config=1`}
                        aria-label={`Configurar ${site.name}`}
                        title="Configurar site"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <RiSettings3Line className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-5">
            <EmptyState title="Nenhum site aqui ainda">
              {statusFilter ? "Nenhum site com esse status. Escolha outro filtro." : "Cole o endereço de um site acima para começar a monitorar."}
            </EmptyState>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function OverviewContent({
  title,
  subtitle,
  rows,
  lastRun,
  owner,
  folders,
  defaultFolderId,
  statusFilter,
  folderNames,
  basePath = "/",
  actions,
}: {
  title: string;
  subtitle: string;
  rows: OverviewRow[];
  lastRun: Date | null;
  owner: boolean;
  folders: { id: string; name: string }[];
  defaultFolderId?: string;
  statusFilter?: string;
  folderNames: Record<string, string>;
  basePath?: string;
  actions?: ReactNode;
}) {
  const live = rows.filter((r) => r.status === "no_ar").length;
  const vals = rows
    .flatMap((r) => [r.desktop?.performanceScore, r.desktop?.accessibilityScore, r.desktop?.bestPracticesScore, r.desktop?.seoScore])
    .filter((v): v is number => typeof v === "number");
  const overall = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;

  return (
    <Page title={title} subtitle={subtitle} actions={actions}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Sites monitorados" value={rows.length} hint={`${live} no ar · ${rows.length - live} em andamento`} />
        <Stat label="Nota média (computador)" value={overall ?? "—"} hint="Média das 4 categorias" />
        <Stat
          label="Última análise"
          value={lastRun ? formatDateTime(lastRun).split(",")[0] : "—"}
          hint={lastRun ? formatDateTime(lastRun) : "Aguardando a primeira"}
        />
      </div>

      {owner && <AddSiteBar folders={folders} defaultFolderId={defaultFolderId} />}

      <SitesTable rows={rows} owner={owner} folderNames={folderNames} basePath={basePath} statusFilter={statusFilter} />
    </Page>
  );
}
