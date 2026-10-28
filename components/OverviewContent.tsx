import Link from "next/link";
import ScoreGauge from "@/components/ScoreGauge";
import StatusSelect from "@/components/StatusSelect";
import AddSiteBar from "@/components/AddSiteBar";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/format";
import type { OverviewRow } from "@/lib/overview";
import type { Status } from "@/lib/types";

function Bar({ value }: { value: number | null }) {
  const color = value === null ? "bg-border" : value >= 90 ? "bg-success" : value >= 50 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value ?? 0}%` }} />
      </div>
      <span className="w-7 text-[13px] tabular-nums text-foreground">{value === null ? "—" : Math.round(value)}</span>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <Card className="px-5 py-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
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
}) {
  const filtered = statusFilter ? rows.filter((r) => r.status === statusFilter) : rows;
  const live = rows.filter((r) => r.status === "no_ar").length;
  const vals = rows
    .flatMap((r) => [r.mobile?.performanceScore, r.mobile?.accessibilityScore, r.mobile?.bestPracticesScore, r.mobile?.seoScore])
    .filter((v): v is number => typeof v === "number");
  const overall = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-8 py-7">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Sites monitorados" value={rows.length} hint={`${live} no ar · ${rows.length - live} em andamento`} />
        <Stat label="Nota média (celular)" value={overall ?? "—"} hint="Média das 4 categorias" />
        <Stat
          label="Última análise"
          value={lastRun ? formatDateTime(lastRun).split(",")[0] : "—"}
          hint={lastRun ? formatDateTime(lastRun) : "Aguardando a primeira"}
        />
      </div>

      {owner && <AddSiteBar folders={folders} defaultFolderId={defaultFolderId} />}

      <Card className="overflow-hidden">
        <CardHeader title="Sites monitorados" description="Clique em um site para ver a análise completa." />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-y border-border bg-secondary/60 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-2">Site</th>
                <th className="px-3 py-2">Desempenho</th>
                <th className="px-3 py-2">Acessib.</th>
                <th className="px-3 py-2">Boas práticas</th>
                <th className="px-3 py-2">SEO</th>
                <th className="px-6 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((site) => (
                <tr key={site.id} className="border-b border-border last:border-b-0 hover:bg-secondary/40">
                  <td className="px-6 py-3">
                    <Link href={`/site/${site.id}`} className="flex items-center gap-3">
                      <ScoreGauge score={site.mobile?.performanceScore ?? null} label="" size={38} />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-foreground">{site.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {site.folderId && folderNames[site.folderId] ? `${folderNames[site.folderId]} · ` : ""}
                          {site.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-3"><Bar value={site.mobile?.performanceScore ?? null} /></td>
                  <td className="px-3 py-3"><Bar value={site.mobile?.accessibilityScore ?? null} /></td>
                  <td className="px-3 py-3"><Bar value={site.mobile?.bestPracticesScore ?? null} /></td>
                  <td className="px-3 py-3"><Bar value={site.mobile?.seoScore ?? null} /></td>
                  <td className="px-6 py-3 text-right">
                    <StatusSelect siteId={site.id} status={site.status as Status} readOnly={!owner} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="px-6 py-8 text-center text-[13px] text-muted-foreground">Nenhum site aqui ainda.</p>
          )}
        </div>
        <p className="border-t border-border px-6 py-2.5 text-xs text-muted-foreground">Notas da análise para celular.</p>
      </Card>
    </div>
  );
}
