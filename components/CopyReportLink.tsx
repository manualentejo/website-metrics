"use client";

import { useState } from "react";
import { RiCheckLine, RiLinkM } from "@remixicon/react";

/** Gera um link assinado do relatório (vale 14 dias) e copia para a área de transferência. */
export default function CopyReportLink({ date, label = false }: { date: string; label?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function copy() {
    setState("busy");
    try {
      const res = await fetch(`/api/reports/share?date=${date}`);
      const data = (await res.json()) as { url?: string };
      if (!res.ok || !data.url) throw new Error();
      await navigator.clipboard.writeText(data.url);
      setState("done");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  const text = state === "done" ? "Link copiado" : state === "error" ? "Não foi possível" : "Copiar link";
  return (
    <button
      type="button"
      onClick={copy}
      disabled={state === "busy"}
      aria-label={`Copiar link do relatório de ${date}`}
      title={text}
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-bg-white-0 px-2 text-label-sm text-text-strong-950 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-[color:var(--accent-soft)] disabled:opacity-60 ${label ? "px-3" : "w-8 px-0"}`}
    >
      {state === "done" ? <RiCheckLine className="size-4" /> : <RiLinkM className="size-4" />}
      {label && text}
    </button>
  );
}
