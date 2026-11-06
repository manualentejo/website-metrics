"use client";

import { useCallback, useEffect, useState } from "react";
import { RiRefreshLine } from "@remixicon/react";
import Markdown from "@/components/gemini/Markdown";

/** Texto da Numa sobre a semana. Vem do Gemini (com cache enquanto os dados não mudam); se falhar, o resto do painel continua valendo. */
export default function NumaSummary() {
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/numa/summary${refresh ? "?refresh=1" : ""}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `erro ${res.status}`);
      setText(data.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "erro");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="ai-gradient rounded-xl p-3 ring-1 ring-inset ring-stroke-soft-200">
      {loading ? (
        <div className="space-y-2" aria-busy="true" aria-label="A Numa está escrevendo">
          <div className="h-3 w-full animate-pulse rounded bg-bg-soft-200" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-bg-soft-200" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-bg-soft-200" />
        </div>
      ) : error ? (
        <p className="text-paragraph-xs text-text-sub-600">A Numa não conseguiu escrever o resumo agora. Os dados abaixo continuam valendo.</p>
      ) : (
        <div className="text-paragraph-sm text-text-strong-950">
          <Markdown text={text ?? ""} />
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2 text-paragraph-xs text-text-soft-400">
        <span>Escrito pela Numa com base nos dados do painel.</span>
        <button type="button" onClick={() => load(true)} disabled={loading} className="inline-flex items-center gap-1 text-label-xs text-text-sub-600 hover:text-text-strong-950 disabled:opacity-40">
          <RiRefreshLine className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>
    </div>
  );
}
