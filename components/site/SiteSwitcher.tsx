"use client";

import { useRouter } from "next/navigation";
import { RiArrowDownSLine } from "@remixicon/react";

/** Troca de site mantendo a aba atual (ex.: SEO de um site → SEO do outro). */
export default function SiteSwitcher({ sites, currentId, tab }: { sites: { id: string; name: string }[]; currentId: string; tab: string }) {
  const router = useRouter();
  if (sites.length < 2) return null;
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Trocar de site</span>
      <select
        value={currentId}
        onChange={(e) => router.push(`/site/${e.target.value}${tab}`)}
        className="h-9 max-w-[12rem] appearance-none rounded-lg bg-bg-white-0 pl-3 pr-8 text-label-sm text-text-strong-950 ring-1 ring-inset ring-stroke-soft-200 hover:bg-bg-weak-50 focus-visible:outline-none focus-visible:ring-stroke-strong-950"
      >
        {sites.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <RiArrowDownSLine className="pointer-events-none absolute right-2 size-4 text-text-sub-600" />
    </label>
  );
}
