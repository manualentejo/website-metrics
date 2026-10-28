"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { RiCloseLine, RiMenuLine } from "@remixicon/react";

/** Sidebar fixa no desktop; no tablet/celular vira uma gaveta aberta por um botão no topo. */
export default function SidebarFrame({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open]);

  return (
    <div className="flex h-screen flex-col bg-bg-white-0 lg:flex-row">
      <div className="hidden lg:block">{sidebar}</div>

      <div className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-stroke-soft-200 px-3 lg:hidden">
        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="flex size-9 items-center justify-center rounded-lg text-text-strong-950 hover:bg-bg-weak-50"
        >
          <RiMenuLine className="size-5" />
        </button>
        <span className="text-label-md text-text-strong-950">Métricas</span>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative h-full w-60 bg-bg-white-0 shadow-regular-md">
            {sidebar}
            <button
              type="button"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-3 flex size-8 items-center justify-center rounded-lg text-text-sub-600 hover:bg-bg-weak-50"
            >
              <RiCloseLine className="size-5" />
            </button>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
