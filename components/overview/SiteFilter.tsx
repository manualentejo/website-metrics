"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RiArrowDownSLine, RiCheckLine, RiGlobalLine } from "@remixicon/react";

/** Filtro multi-seleção de websites. O estado vive na URL (?sites=a,b) para ser compartilhável. */
export default function SiteFilter({ sites, selected }: { sites: { id: string; name: string }[]; selected: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(selected), [selected.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  function apply(ids: string[]) {
    const next = new URLSearchParams(params.toString());
    if (ids.length && ids.length < sites.length) next.set("sites", ids.join(","));
    else next.delete("sites");
    router.push(`${pathname}${next.toString() ? `?${next}` : ""}`);
    setOpen(false);
  }

  const all = selected.length === 0 || selected.length >= sites.length;
  const label = all ? "Todos os sites" : selected.length === 1 ? (sites.find((s) => s.id === selected[0])?.name ?? "1 site") : `${selected.length} sites`;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 max-w-[14rem] items-center gap-2 rounded-lg bg-bg-white-0 px-3 text-label-sm text-text-strong-950 ring-1 ring-inset ring-stroke-soft-200 transition duration-200 hover:bg-bg-weak-50 focus-visible:outline-none focus-visible:ring-stroke-strong-950"
      >
        <RiGlobalLine className="size-4 flex-shrink-0 text-text-sub-600" />
        <span className="truncate">{label}</span>
        <RiArrowDownSLine className="size-4 flex-shrink-0 text-text-sub-600" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl bg-bg-white-0 p-2 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200 sm:left-0 sm:right-auto">
          <ul role="listbox" aria-multiselectable className="max-h-64 overflow-y-auto">
            {sites.map((s) => {
              const on = draft.length === 0 ? true : draft.includes(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => {
                      const base = draft.length === 0 ? sites.map((x) => x.id) : draft;
                      setDraft(base.includes(s.id) ? base.filter((i) => i !== s.id) : [...base, s.id]);
                    }}
                    className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-label-sm text-text-strong-950 hover:bg-bg-weak-50"
                  >
                    <span className={`flex size-4 flex-shrink-0 items-center justify-center rounded ${on ? "bg-bg-strong-950 text-text-white-0" : "ring-1 ring-inset ring-stroke-sub-300"}`}>
                      {on && <RiCheckLine className="size-3" />}
                    </span>
                    <span className="truncate">{s.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t border-stroke-soft-200 pt-2">
            <button type="button" onClick={() => apply([])} className="px-2 text-label-xs text-text-sub-600 hover:text-text-strong-950">
              Todos
            </button>
            <button
              type="button"
              disabled={draft.length === 0 && selected.length === 0 ? false : draft.length === 0}
              onClick={() => apply(draft)}
              className="h-8 rounded-lg bg-bg-strong-950 px-3 text-label-xs text-text-white-0 disabled:opacity-40"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
