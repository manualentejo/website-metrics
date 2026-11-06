"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { RiCloseLine, RiMenuFoldLine, RiMenuLine, RiMenuUnfoldLine } from "@remixicon/react";

const SidebarContext = createContext<{ collapsed: boolean; toggle: () => void }>({ collapsed: false, toggle: () => {} });

/** Botão de recolher/expandir a barra lateral (só no desktop). Mostra o estado para leitores de tela e tem dica ao passar o mouse. */
export function SidebarCollapseButton() {
  const { collapsed, toggle } = useContext(SidebarContext);
  const Icon = collapsed ? RiMenuUnfoldLine : RiMenuFoldLine;
  const label = collapsed ? "Expandir barra lateral" : "Recolher barra lateral";
  return (
    <button
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-expanded={!collapsed}
        className="hidden size-8 flex-shrink-0 items-center justify-center rounded-lg text-text-sub-600 transition duration-200 hover:bg-bg-soft-200 hover:text-text-strong-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-strong-950 lg:flex group-data-[collapsed=true]/sb:size-10"
      >
        <Icon className="size-5" />
      </button>
  );
}

/**
 * Sidebar fixa no desktop (que pode ficar só com ícones); no tablet/celular vira uma gaveta aberta por um botão no topo.
 * O estado recolhido vem de um cookie, então a página já abre do jeito que você deixou, sem piscar.
 */
export default function SidebarFrame({ sidebar, children, initialCollapsed = false }: { sidebar: ReactNode; children: ReactNode; initialCollapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open]);

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        document.cookie = `sidebar=${next ? "collapsed" : "open"}; path=/; max-age=31536000; samesite=lax`;
      } catch {
        /* sem cookie: vale só nesta visita */
      }
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      <div className="fixed inset-0 flex flex-col overflow-hidden bg-bg-white-0 lg:flex-row">
        <div data-collapsed={collapsed} className="group/sb relative hidden flex-shrink-0 lg:block">
          {sidebar}
        </div>

        <div className="flex h-12 flex-shrink-0 items-center gap-3 border-b border-stroke-soft-200 px-3 lg:hidden">
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-text-strong-950 hover:bg-bg-soft-200"
          >
            <RiMenuLine className="size-5" />
          </button>
          <span className="text-label-md text-text-strong-950">Métricas</span>
        </div>

        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
            <div className="group/sb relative h-full w-60 bg-bg-white-0 shadow-regular-md">
              {sidebar}
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="absolute right-2 top-3 flex size-8 items-center justify-center rounded-lg text-text-sub-600 hover:bg-bg-soft-200"
              >
                <RiCloseLine className="size-5" />
              </button>
            </div>
          </div>
        )}

        {children}
      </div>
    </SidebarContext.Provider>
  );
}
