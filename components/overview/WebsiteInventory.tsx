"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RiArrowRightUpLine, RiSearchLine, RiSettings3Line } from "@remixicon/react";
import SiteIcon from "@/components/SiteIcon";
import StatusSelect from "@/components/StatusSelect";
import { inputClass } from "@/components/ui/fields";
import { Segmented } from "@/components/ui/Page";
import ChartEmptyState from "@/components/charts/ChartEmptyState";
import type { Status } from "@/lib/types";

export type Device = "desktop" | "mobile";
export interface Cell {
  v: number | null;
  d: number | null; // variação desde a auditoria anterior
}
export interface InventoryRow {
  id: string;
  name: string;
  url: string;
  status: Status;
  folderId: string | null;
  folder: string | null;
  geo: number | null;
  createdAt: string; // ISO
  m: Record<Device, { p: Cell; a: Cell; b: Cell; s: Cell; at: string | null }>;
}

const COLS = [
  { key: "p", label: "Desemp." },
  { key: "a", label: "Acessib." },
  { key: "b", label: "Boas prát." },
  { key: "s", label: "SEO" },
] as const;

const SORTS = [
  { value: "name", label: "Nome (A–Z)" },
  { value: "best", label: "Melhor nota média" },
  { value: "worst", label: "Pior nota média" },
  { value: "audit", label: "Auditoria mais recente" },
  { value: "recent", label: "Adicionados recentemente" },
] as const;
type SortKey = (typeof SORTS)[number]["value"];

const bare = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }) : "—");

function Score({ c, best }: { c: Cell; best?: boolean }) {
  if (c.v === null) return <span className="text-text-soft-400">—</span>;
  const tone = c.v >= 90 ? "bg-success-base" : c.v >= 50 ? "bg-warning-base" : "bg-error-base";
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <span className={`size-2 rounded-full ${tone}`} aria-hidden />
      <span className={best ? "rounded-md bg-success-lighter px-1.5 py-0.5 text-success-base" : "text-text-strong-950"}>{Math.round(c.v)}</span>
      {c.d ? (
        <span className={`hidden text-[10px] lg:inline ${c.d > 0 ? "text-success-base" : "text-error-base"}`}>
          {c.d > 0 ? "▲" : "▼"}
          {Math.abs(Math.round(c.d))}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Lista e comparação de sites: busca, filtro de status, ordenação, notas por dispositivo (Computador/Celular)
 * com variação e a nota GEO. A troca de dispositivo atualiza a tabela na hora, sem recarregar.
 */
export default function WebsiteInventory({ rows, owner, initialDevice = "desktop" }: { rows: InventoryRow[]; owner: boolean; initialDevice?: Device }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | Status>("");
  const [sort, setSort] = useState<SortKey>("name");
  const [device, setDevice] = useState<Device>(initialDevice);

  const avg = (r: InventoryRow) => {
    const v = COLS.map((c) => r.m[device][c.key].v).filter((n): n is number => n !== null);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = rows.filter((r) => (!status || r.status === status) && (!term || r.name.toLowerCase().includes(term) || bare(r.url).toLowerCase().includes(term)));
    const num = (a: number | null, b: number | null, dir: 1 | -1) => (a === null ? 1 : b === null ? -1 : (a - b) * dir); // sem nota vai para o fim
    return filtered.sort((a, b) => {
      const A = a.m[device].at;
      const B = b.m[device].at;
      return sort === "name" ? a.name.localeCompare(b.name, "pt-BR")
        : sort === "best" ? num(avg(a), avg(b), -1)
        : sort === "worst" ? num(avg(a), avg(b), 1)
        : sort === "audit" ? (B ?? "").localeCompare(A ?? "")
        : b.createdAt.localeCompare(a.createdAt);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, status, sort, device]);

  const best = useMemo(() => {
    const out: Record<string, number> = {};
    for (const c of COLS) out[c.key] = Math.max(-1, ...list.map((r) => r.m[device][c.key].v ?? -1));
    out.geo = Math.max(-1, ...list.map((r) => r.geo ?? -1));
    return out;
  }, [list, device]);

  function pickDevice(d: Device) {
    setDevice(d);
    try {
      const u = new URL(window.location.href);
      if (d === "mobile") u.searchParams.set("d", "mobile");
      else u.searchParams.delete("d");
      window.history.replaceState(null, "", u);
    } catch {
      /* sem URL: só o estado muda */
    }
  }

  return (
    <div className="rounded-2xl bg-bg-white-0 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200">
      <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4">
        <Segmented
          label="Dispositivo"
          items={[
            { label: "Computador", href: "#", active: device === "desktop" },
            { label: "Celular", href: "#", active: device === "mobile" },
          ]}
          onSelect={(i) => pickDevice(i === 0 ? "desktop" : "mobile")}
        />
        <label className="relative min-w-[11rem] flex-1 sm:max-w-xs">
          <span className="sr-only">Buscar por nome ou domínio</span>
          <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-soft-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou domínio" className={`${inputClass} w-full pl-9`} />
        </label>
        <Segmented
          label="Status"
          items={[
            { label: "Todos", href: "#", active: status === "" },
            { label: "No ar", href: "#", active: status === "no_ar" },
            { label: "Em andamento", href: "#", active: status === "em_andamento" },
          ]}
          onSelect={(i) => setStatus(i === 0 ? "" : i === 1 ? "no_ar" : "em_andamento")}
        />
        <label className="ml-auto flex items-center gap-2 text-paragraph-xs text-text-sub-600">
          <span className="hidden sm:inline">Ordenar</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`${inputClass} h-9`} aria-label="Ordenar por">
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
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-y border-stroke-soft-200 bg-bg-weak-50 text-subheading-xs uppercase text-text-soft-400">
                <th className="sticky left-0 z-[1] bg-bg-weak-50 px-3 py-2 font-normal sm:px-4">Site</th>
                {COLS.map((c) => (
                  <th key={c.key} className="px-3 py-2 font-normal">{c.label}</th>
                ))}
                <th className="px-3 py-2 font-normal">GEO</th>
                <th className="hidden px-3 py-2 font-normal xl:table-cell">Workspace</th>
                <th className="hidden px-3 py-2 font-normal xl:table-cell">Auditoria</th>
                <th className="px-3 py-2 font-normal">Status</th>
                <th className="px-3 py-2 text-right font-normal sm:px-4"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="group border-b border-stroke-soft-200 last:border-b-0 hover:bg-bg-weak-50">
                  <td className="sticky left-0 z-[1] bg-bg-white-0 px-3 py-2.5 group-hover:bg-bg-weak-50 sm:px-4">
                    <Link href={`/site/${r.id}`} className="flex items-center gap-3">
                      <SiteIcon url={r.url} name={r.name} size={32} className="ring-1 ring-inset ring-stroke-soft-200" />
                      <span className="min-w-0 max-w-[11rem]">
                        <span className="block truncate text-label-sm text-text-strong-950">{r.name}</span>
                        <span className="block truncate text-paragraph-xs text-text-sub-600">{bare(r.url)}</span>
                      </span>
                    </Link>
                  </td>
                  {COLS.map((c) => (
                    <td key={c.key} className="px-3 py-2.5 text-label-sm">
                      <Score c={r.m[device][c.key]} best={list.length > 1 && r.m[device][c.key].v !== null && r.m[device][c.key].v === best[c.key]} />
                    </td>
                  ))}
                  <td className="px-3 py-2.5 text-label-sm">
                    <Score c={{ v: r.geo, d: null }} best={list.length > 1 && r.geo !== null && r.geo === best.geo} />
                  </td>
                  <td className="hidden px-3 py-2.5 text-paragraph-sm text-text-sub-600 xl:table-cell">{r.folder ?? "—"}</td>
                  <td className="hidden px-3 py-2.5 text-paragraph-sm text-text-sub-600 xl:table-cell">{day(r.m[device].at)}</td>
                  <td className="px-3 py-2.5"><StatusSelect siteId={r.id} status={r.status} readOnly={!owner} /></td>
                  <td className="px-3 py-2.5 sm:px-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/site/${r.id}`} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-label-xs text-text-sub-600 hover:bg-bg-soft-200 hover:text-text-strong-950">
                        Abrir <RiArrowRightUpLine className="size-3.5" />
                      </Link>
                      {owner && (
                        <Link
                          href={`/site/${r.id}/settings`}
                          aria-label={`Configurar ${r.name}`}
                          title="Configurar monitoramento"
                          className="flex size-8 items-center justify-center rounded-lg text-text-sub-600 hover:bg-bg-soft-200 hover:text-text-strong-950"
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
        {list.length} de {rows.length} sites · notas do Lighthouse no {device === "desktop" ? "computador" : "celular"} (▲▼ = variação desde a auditoria anterior; em verde, a melhor nota de cada coluna). GEO é a auditoria técnica para IAs.
      </p>
    </div>
  );
}
