"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RiArrowDownLine, RiArrowUpLine } from "@remixicon/react";
import TrendIndicator from "@/components/charts/TrendIndicator";
import StatusBadge from "./StatusBadge";
import type { SiteSummary } from "@/lib/portfolio";

type Key = "name" | "seo" | "performance" | "visits" | "trend" | "status";

const score = (v: number | null) => {
  if (v === null) return <span className="text-text-soft-400">—</span>;
  const tone = v >= 90 ? "bg-success-base" : v >= 50 ? "bg-warning-base" : "bg-error-base";
  return (
    <span className="inline-flex items-center gap-2 tabular-nums text-text-strong-950">
      <span className={`size-2 rounded-full ${tone}`} aria-hidden />
      {Math.round(v)}
    </span>
  );
};

/** Comparação compacta entre sites (ordenável). Não substitui a página Websites: aqui não há cadastro. */
export default function WebsitePerformanceTable({ rows, limit = 8 }: { rows: SiteSummary[]; limit?: number }) {
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "seo", dir: 1 });

  const sorted = useMemo(() => {
    const val = (r: SiteSummary): number | string | null =>
      sort.key === "name" ? r.name.toLowerCase()
      : sort.key === "status" ? r.status
      : sort.key === "trend" ? (r.seoDelta ?? 0) + (r.performanceDelta ?? 0)
      : r[sort.key];
    return [...rows].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      if (x === null && y === null) return 0;
      if (x === null) return 1; // sem dado vai sempre para o fim
      if (y === null) return -1;
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [rows, sort]);

  const Th = ({ k, children, right }: { k: Key; children: string; right?: boolean }) => (
    <th scope="col" aria-sort={sort.key === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className={`px-3 py-2 font-normal ${right ? "text-right" : ""}`}>
      <button
        type="button"
        onClick={() => setSort((s) => (s.key === k ? { key: k, dir: (-s.dir) as 1 | -1 } : { key: k, dir: k === "name" ? 1 : -1 }))}
        className="inline-flex items-center gap-1 uppercase hover:text-text-strong-950 focus-visible:outline-none focus-visible:underline"
      >
        {children}
        {sort.key === k && (sort.dir === 1 ? <RiArrowUpLine className="size-3" /> : <RiArrowDownLine className="size-3" />)}
      </button>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <caption className="sr-only">Comparação de notas entre sites (Lighthouse, computador)</caption>
        <thead>
          <tr className="border-y border-stroke-soft-200 bg-bg-weak-50 text-subheading-xs text-text-soft-400">
            <Th k="name">Website</Th>
            <Th k="seo">SEO</Th>
            <Th k="performance">Desempenho</Th>
            <Th k="visits">Visitas</Th>
            <Th k="trend">Tendência</Th>
            <Th k="status" right>Status</Th>
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, limit).map((r) => (
            <tr key={r.id} className="border-b border-stroke-soft-200 last:border-b-0 hover:bg-bg-weak-50">
              <td className="px-3 py-2.5">
                <Link href={`/site/${r.id}`} className="block min-w-0 focus-visible:outline-none focus-visible:underline">
                  <span className="block truncate text-label-sm text-text-strong-950">{r.name}</span>
                  <span className="block truncate text-paragraph-xs text-text-sub-600">{r.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                </Link>
              </td>
              <td className="px-3 py-2.5 text-label-sm">{score(r.seo)}</td>
              <td className="px-3 py-2.5 text-label-sm">{score(r.performance)}</td>
              <td className="px-3 py-2.5 text-label-sm tabular-nums">
                {r.visits === null ? <span className="text-text-soft-400" title="Código de rastreio não instalado">—</span> : r.visits.toLocaleString("pt-BR")}
              </td>
              <td className="px-3 py-2.5">
                <span className="flex flex-col gap-0.5">
                  <TrendIndicator current={r.seo} delta={r.seoDelta} suffix="SEO" />
                  <TrendIndicator current={r.performance} delta={r.performanceDelta} suffix="Desemp." />
                </span>
              </td>
              <td className="px-3 py-2.5 text-right"><StatusBadge status={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
