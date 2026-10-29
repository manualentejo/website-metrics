"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RiCheckboxCircleFill, RiCloseCircleFill, RiAlertFill, RiArrowDownSLine, RiLoader4Line, RiRefreshLine } from "@remixicon/react";
import ScoreGauge from "@/components/ScoreGauge";
import Button from "@/components/ui/Button";
import { notification } from "@/hooks/use-notification";
import type { GeoCheck } from "@/lib/geoAudit";

const META = {
  fail: { label: "Corrigir", icon: RiCloseCircleFill, color: "text-error-base", tile: "bg-error-lighter" },
  warn: { label: "Pode melhorar", icon: RiAlertFill, color: "text-warning-base", tile: "bg-warning-lighter" },
  ok: { label: "Tudo certo", icon: RiCheckboxCircleFill, color: "text-success-base", tile: "bg-success-lighter" },
} as const;

/** Nota GEO + lista de verificações em linguagem simples. Se ainda não houver auditoria, roda uma sozinha (é de graça). */
export default function GeoAuditPanel({
  siteId,
  score,
  previousScore,
  checks,
  canRun,
}: {
  siteId: string;
  score: number | null;
  previousScore: number | null;
  checks: GeoCheck[];
  canRun: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function run(silent = false) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/geo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "audit" }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível auditar.");
      if (!silent) notification({ status: "success", variant: "filled", title: `Auditoria GEO concluída: nota ${data.score}` });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (score === null && canRun && !started.current) {
      started.current = true;
      void run(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const groups = (["fail", "warn", "ok"] as const).map((k) => ({ k, items: checks.filter((c) => c.status === k) }));
  const delta = score !== null && previousScore !== null ? score - previousScore : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-5">
        <ScoreGauge score={score} label="" size={104} />
        <div className="min-w-0 flex-1">
          <p className="text-label-md text-text-strong-950">
            {score === null ? "Auditando o site…" : score >= 80 ? "Seu site está bem preparado para IAs" : score >= 50 ? "Seu site está parcialmente preparado" : "Seu site ainda não está preparado para IAs"}
          </p>
          <p className="mt-0.5 text-paragraph-sm text-text-sub-600">
            {score === null
              ? "Lemos a página, o robots.txt e o sitemap. Leva uns segundos e não gasta crédito de IA."
              : `${groups[0].items.length} para corrigir, ${groups[1].items.length} para melhorar, ${groups[2].items.length} certos.`}
            {delta !== null && delta !== 0 && <span className={delta > 0 ? " text-success-base" : " text-error-base"}> {delta > 0 ? "+" : "−"}{Math.abs(delta)} pontos desde a auditoria anterior.</span>}
          </p>
        </div>
        {canRun && (
          <Button variant="outline" onClick={() => run()} disabled={busy}>
            {busy ? <RiLoader4Line className="size-4 animate-spin" /> : <RiRefreshLine className="size-4" />}
            {busy ? "Auditando…" : "Auditar de novo"}
          </Button>
        )}
      </div>
      {error && <p role="alert" className="text-paragraph-xs text-error-base">{error}</p>}

      {groups.map(({ k, items }) =>
        items.length === 0 ? null : (
          <section key={k}>
            <h3 className="mb-2 flex items-center gap-2 text-label-xs uppercase tracking-wide text-text-soft-400">
              {META[k].label}
              <span className="rounded-full bg-bg-weak-50 px-1.5 text-text-sub-600">{items.length}</span>
            </h3>
            <ul className="grid gap-2">
              {items.map((c) => {
                const Icon = META[c.status].icon;
                return (
                  <li key={c.id}>
                    <details className="group rounded-xl bg-bg-white-0 ring-1 ring-inset ring-stroke-soft-200 open:ring-stroke-sub-300" open={k === "fail" && items.indexOf(c) === 0}>
                      <summary className="flex cursor-pointer list-none items-center gap-3 p-3 sm:p-4">
                        <span className={`flex size-9 flex-shrink-0 items-center justify-center rounded-lg ${META[c.status].tile}`}>
                          <Icon className={`size-5 ${META[c.status].color}`} aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-label-sm text-text-strong-950">{c.title}</span>
                          <span className="block truncate text-paragraph-xs text-text-sub-600">{c.found}</span>
                        </span>
                        <RiArrowDownSLine className="size-5 flex-shrink-0 text-text-sub-600 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="space-y-3 border-t border-stroke-soft-200 px-4 pb-4 pt-3 text-paragraph-sm">
                        <p><span className="text-label-xs uppercase tracking-wide text-text-soft-400">Por que importa</span><br /><span className="text-text-strong-950">{c.why}</span></p>
                        {c.status !== "ok" && (
                          <p><span className="text-label-xs uppercase tracking-wide text-text-soft-400">Como corrigir</span><br /><span className="text-text-strong-950">{c.fix}</span></p>
                        )}
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          </section>
        )
      )}
    </div>
  );
}
