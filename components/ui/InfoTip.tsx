"use client";
import { RiInformationLine } from "@remixicon/react";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { GLOSSARY } from "@/lib/glossary";

const WIDTH = 288;
const MARGIN = 8;

/**
 * Ícone ⓘ que mostra uma explicação ao passar o mouse, focar com o teclado ou clicar
 * (no celular não há hover, então o clique fixa o balão aberto). O balão é renderizado
 * num portal com posição fixa para não ser cortado por cards com overflow.
 */
export default function InfoTip({
  term,
  title,
  text,
}: {
  term?: string;
  title?: string;
  text?: string;
  align?: "start" | "center" | "end";
}) {
  const entry = term ? GLOSSARY[term] : undefined;
  const heading = title ?? entry?.title;
  const body = text ?? entry?.text;
  const good = entry?.good;

  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const open = hovered || pinned;

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const place = () => {
      const r = buttonRef.current!.getBoundingClientRect();
      const h = tipRef.current?.offsetHeight ?? 120;
      const left = Math.min(Math.max(r.left + r.width / 2 - WIDTH / 2, MARGIN), window.innerWidth - WIDTH - MARGIN);
      const below = r.bottom + MARGIN;
      const top = below + h > window.innerHeight - MARGIN ? Math.max(r.top - MARGIN - h, MARGIN) : below;
      setPos({ top, left });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  useEffect(() => {
    if (!pinned) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !tipRef.current?.contains(t)) setPinned(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPinned(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  if (!body) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={heading ? `O que é ${heading}?` : "Mais informações"}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setPinned((p) => !p);
        }}
        className="inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full align-middle text-text-soft-400 transition-colors hover:text-text-strong-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <RiInformationLine className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      {open &&
        createPortal(
          <div
            ref={tipRef}
            id={id}
            role="tooltip"
            style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: WIDTH }}
            className="fixed z-[60] rounded-xl bg-bg-white-0 p-3 text-left text-paragraph-xs normal-case text-text-sub-600 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200"
          >
            {heading && <span className="mb-1 block text-label-sm text-text-strong-950">{heading}</span>}
            <span className="block">{body}</span>
            {good && <span className="mt-2 block text-label-xs text-success-base">{good}</span>}
          </div>,
          document.body
        )}
    </>
  );
}
