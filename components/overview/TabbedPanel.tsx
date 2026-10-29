"use client";

import { useState, type ReactNode } from "react";

/** Painel com abas para dividir o mesmo espaço entre conteúdos (já renderizados no servidor). */
export default function TabbedPanel({ tabs }: { tabs: { key: string; label: string; node: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0].key);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" className="mx-4 mb-2 mt-3 inline-flex flex-shrink-0 gap-1 self-start rounded-10 bg-bg-weak-50 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
            className={`h-7 rounded-md px-3 text-label-sm transition duration-200 ${
              active === t.key ? "bg-bg-white-0 text-text-strong-950 shadow-toggle-switch" : "text-text-soft-400 hover:text-text-strong-950"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{tabs.find((t) => t.key === active)?.node}</div>
    </div>
  );
}
