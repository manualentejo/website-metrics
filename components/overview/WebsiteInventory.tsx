"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RiArrowRightUpLine, RiSearchLine, RiSettings3Line } from "@remixicon/react";
import StatusSelect from "@/components/StatusSelect";
import { inputClass } from "@/components/ui/fields";
import { Segmented } from "@/components/ui/Page";
import ChartEmptyState from "@/components/charts/ChartEmptyState";
import type { Status } from "@/lib/types";

export interface InventoryRow {
  id: string;
  name: string;
  url: string;
  status: Status;
  folder: string | null;
  seo: number | null;
  performance: number | null;
  lastAudit: string | null; // ISO
  createdAt: string; // ISO
}

const SORTS = [
  { value: "name", label: "Nome (A–Z)" },
  { value: "recent", label: "Adicionados recentemente" },
  { value: "audit", label: "Auditoria mais recente" },
  { value: "seo", label: "Menor nota de SEO" },
] as const;
type SortKey = (typeof SORTS)[number]["value"];

const bare = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }) : "—");

function Dot({ v }: { v: number | null }) {
  if (v === null) return <span className="text-text-soft-400">—</span>;
  const tone = v >= 90 ? "bg-success-base" : v >= 50 ? "bg-warning-base" : "bg-error-base";
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <span className={`size-2 rounded-full ${tone}`} aria-hidden />
      {Math.round(v)}
    </span>
  );
}

/** Inventário: busca, filtro de status, ordenação e ações por site. Sem gráficos nem análise (isso é do Overview). */
export default function WebsiteInventory({ rows, owner }: { rows: InventoryRow[]; owner: boolean }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | Status>("");
  const [sort, setSort] = useState<SortKey>("name");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = rows.filter((r) => (!status || r.status === status) && (!term || r.name.toLowerCase().includes(term) || bare(r.url).toLowerCase().includes(term)));
    const nullLast = (a: number | null, b: number | null, dir: 1 | -1) => (a === null ? 1 : b === null ? -1 : (a - b) * dir);
    return filtered.sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name, "pt-BR")
      : sort === "recent" ? b.createdAt.localeCompare(a.createdAt)
      : sort === "audit" ? (b.lastAudit ?? "").localeCompare(a.lastAudit ?? "")
      : nullLast(a.seo, b.seo, 1)
    );
  }, [rows, q, status, sort]);

  return (
    <div className="rounded-2xl bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200">
      <div className="flex flex-wrap items-center gap-2 p-4">
        <label className="relative min-w-[12rem] flex-1 sm:max-w-xs">
          <span className="sr-only">Buscar por nome ou domínio</span>
          <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-soft-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou domínio" className={`${inputClass} w-full pl-9`} />
        </label>
        <div role="group" aria-label="Filtrar por status">
          <Segmented
            label="Status"
            items={[
              { label: "Todos", href: "#", active: status === "" },
              { label: "No ar", href: "#", active: status === "no_ar" },
              { label: "Em andamento", href: "#", active: status === "em_andamento" },
            ]}
            onSelect={(i) => setStatus(i === 0 ? "" : i === 1 ? "no_ar" : "em_andamento")}
          />
        </div>
        <label className="ml-auto flex items-center gap-2 text-paragraph-xs text-text-sub-600">
          Ordenar
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${inputClass} h-9`}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {list.length === 0 ? (
        <div className="p-4 pt-0">
          <ChartEmptyState title="Nenhum site encontrado" className="h-40">
            {rows.length ? "Ajuste a busca ou o filtro de status." : "Cole o endereço de um site acima para começar."}
          </ChartEmptyState>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-y border-stroke-soft-200 bg-bg-weak-50 text-subheading-xs uppercase text-text-soft-400">
                <th className="px-4 py-2 font-normal">Site</th>
                <th className="px-3 py-2 font-normal">Workspace</th>
                <th className="px-3 py-2 font-normal">SEO</th>
                <th className="px-3 py-2 font-normal">Desemp.</th>
                <th className="px-3 py-2 font-normal">Última auditoria</th>
                <th className="px-3 py-2 font-normal">Status</th>
                <th className="px-4 py-2 text-right font-normal"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-b border-stroke-soft-200 last:border-b-0 hover:bg-bg-weak-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/site/${r.id}`} className="flex items-center gap-3">
                      <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-bg-weak-50 text-label-sm uppercase text-text-sub-600 ring-1 ring-inset ring-stroke-soft-200">
                        {r.name.slice(0, 1)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-label-sm text-text-strong-950">{r.name}</span>
                        <span className="block truncate text-paragraph-xs text-text-sub-600">{bare(r.url)}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-paragraph-sm text-text-sub-600">{r.folder ?? "—"}</td>
                  <td className="px-3 py-2.5 text-label-sm"><Dot v={r.seo} /></td>
                  <td className="px-3 py-2.5 text-label-sm"><Dot v={r.performance} /></td>
                  <td className="px-3 py-2.5 text-paragraph-sm text-text-sub-600">{day(r.lastAudit)}</td>
                  <td className="px-3 py-2.5"><StatusSelect siteId={r.id} status={r.status} readOnly={!owner} /></td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/site/${r.id}`} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-label-xs text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950">
                        Abrir <RiArrowRightUpLine className="size-3.5" />
                      </Link>
                      {owner && (
                        <Link
                          href={`/site/${r.id}/settings`}
                          aria-label={`Configurar ${r.name}`}
                          title="Configurar monitoramento"
                          className="flex size-8 items-center justify-center rounded-lg text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950"
                        >
                          <RiSettings3Line className="size-5" />
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="border-t border-stroke-soft-200 px-4 py-2.5 text-paragraph-xs text-text-sub-600">
        {list.length} de {rows.length} sites · notas do Lighthouse (computador). A comparação e os gráficos ficam na <Link href="/" className="underline underline-offset-2">Visão geral</Link>.
      </p>
    </div>
  );
}
