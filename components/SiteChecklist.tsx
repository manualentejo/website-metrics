"use client";

import { useState } from "react";
import { RiSearchLine } from "@remixicon/react";
import { inputClass } from "@/components/ui/fields";

export interface PickableSite {
  id: string;
  name: string;
  url: string;
  folderName?: string | null; // workspace atual, mostrado como aviso
}

// Lista de sites com caixas de seleção (e busca quando há muitos).
export default function SiteChecklist({
  sites,
  selected,
  onChange,
  emptyText,
}: {
  sites: PickableSite[];
  selected: string[];
  onChange: (ids: string[]) => void;
  emptyText: string;
}) {
  const [q, setQ] = useState("");
  const shown = sites.filter((s) => `${s.name} ${s.url}`.toLowerCase().includes(q.toLowerCase()));

  if (sites.length === 0) return <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">{emptyText}</p>;

  return (
    <div>
      {sites.length > 6 && (
        <div className="relative mb-2">
          <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar site" aria-label="Buscar site" className={`${inputClass} w-full pl-8`} />
        </div>
      )}
      <ul className="max-h-56 divide-y divide-border overflow-y-auto rounded-md border border-border">
        {shown.map((s) => (
          <li key={s.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-secondary/60">
              <input
                type="checkbox"
                checked={selected.includes(s.id)}
                onChange={(e) => onChange(e.target.checked ? [...selected, s.id] : selected.filter((x) => x !== s.id))}
                className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-foreground">{s.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {s.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  {s.folderName ? ` · em ${s.folderName}` : ""}
                </span>
              </span>
            </label>
          </li>
        ))}
        {shown.length === 0 && <li className="px-3 py-3 text-center text-xs text-muted-foreground">Nenhum site com esse nome.</li>}
      </ul>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {selected.length === 0 ? "Nenhum site escolhido." : `${selected.length} ${selected.length === 1 ? "site escolhido" : "sites escolhidos"}.`}
      </p>
    </div>
  );
}
