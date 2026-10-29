"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RiArrowDownLine, RiArrowUpLine } from "@remixicon/react";
import SiteIcon from "@/components/SiteIcon";
import type { SiteSummary } from "@/lib/portfolio";

type Key = "name" | "seo" | "performance" | "geo" | "status";

function Score({ v, delta }: { v: number | null; delta?: number | null }) {
  if (v === null) return <span className="text-text-soft-400">—</span>;
  const tone = v >= 90 ? "bg-success-base" : v >= 50 ? "bg-warning-base" : "bg-error-base";
  return (
    <span className="block min-w-[3.5rem]">
      <span className="flex items-baseline gap-1 tabular-nums text-label-sm text-text-strong-950">
        {Math.round(v)}
        {delta ? (
          <span className={`text-[10px] ${delta > 0 ? "text-success-base" : "text-error-base"}`}>
            {delta > 0 ? "▲" : "▼"}
            {Math.abs(Math.round(delta))}
          </span>
        ) : null}
      </span>
      <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-bg-weak-50">
        <span className={`block h-full rounded-full ${tone}`} style={{ width: `${v}%` }} />
      </span>
    </span>
  );
}

/** Comparação entre sites: ordenável, com rolagem interna quando há muitos sites. Não substitui a página Sites. */
export default function WebsitePerformanceTable({ rows }: { rows: SiteSummary[] }) {
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 }>({ key: "seo", dir: 1 });

  const sorted = useMemo(() => {
    const val = (r: SiteSummary): number | string | null => (sort.key === "name" ? r.name.toLowerCase() : sort.key === "status" ? r.status : r[sort.key]);
    return [...rows].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      if (x === null && y === null) return 0;
      if (x === null) return 1; // sem dado vai sempre para o fim
      if (y === null) return -1;
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [rows, sort]);

  const Th = ({ k, children }: { k: Key; children: string }) => (
    <th scope="col" aria-sort={sort.key === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className="sticky top-0 z-[1] bg-bg-white-0 px-3 py-2 font-normal">
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
    <table className="w-full text-left">
      <caption className="sr-only">Comparação de notas entre sites (Lighthouse e auditoria GEO)</caption>
      <thead>
        <tr className="text-subheading-xs text-text-soft-400">
          <Th k="name">Site</Th>
          <Th k="seo">SEO</Th>
          <Th k="performance">Desemp.</Th>
          <Th k="geo">GEO</Th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((r) => (
          <tr key={r.id} className="border-t border-stroke-soft-200 transition duration-200 hover:bg-bg-weak-50">
            <td className="px-3 py-2">
              <Link href={`/site/${r.id}`} className="flex min-w-0 items-center gap-2.5 focus-visible:outline-none focus-visible:underline">
                <SiteIcon url={r.url} name={r.name} size={24} />
                <span className="min-w-0">
                  <span className="block truncate text-label-sm text-text-strong-950">{r.name}</span>
                  <span className="flex items-center gap-1.5 text-paragraph-xs text-text-sub-600">
                    <span className={`size-1.5 rounded-full ${r.status === "no_ar" ? "bg-success-base" : "bg-warning-base"}`} />
                    {r.status === "no_ar" ? "No ar" : "Em andamento"}
                  </span>
                </span>
              </Link>
            </td>
            <td className="px-3 py-2"><Score v={r.seo} delta={r.seoDelta} /></td>
            <td className="px-3 py-2"><Score v={r.performance} delta={r.performanceDelta} /></td>
            <td className="px-3 py-2"><Score v={r.geo} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
