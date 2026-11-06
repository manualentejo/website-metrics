"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Dica ao lado de um ícone da barra lateral recolhida: etiqueta preta com o nome da seção (e uma linha de ajuda,
 * se houver). Aparece ao passar o mouse ou focar com o teclado, e só quando a barra está recolhida. É desenhada
 * numa camada fixa para não ser cortada pela rolagem da barra.
 */
export default function RailTip({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  function show() {
    const el = ref.current;
    if (!el || !el.closest('[data-collapsed="true"]')) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.top + r.height / 2, left: r.right + 10 });
  }

  return (
    <div ref={ref} onMouseEnter={show} onMouseLeave={() => setPos(null)} onFocusCapture={show} onBlurCapture={() => setPos(null)} onClickCapture={() => setPos(null)}>
      {children}
      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translateY(-50%)" }}
            className="pointer-events-none z-[70] whitespace-nowrap rounded-lg bg-bg-strong-950 px-2.5 py-1.5 text-label-xs text-text-white-0 shadow-regular-md"
          >
            <span aria-hidden className="absolute -left-1 top-1/2 size-2 -translate-y-1/2 rotate-45 rounded-[2px] bg-bg-strong-950" />
            <span className="relative block">{label}</span>
            {hint && <span className="relative block text-[10px] opacity-70">{hint}</span>}
          </div>,
          document.body
        )}
    </div>
  );
}
