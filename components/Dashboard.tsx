"use client";

import { useMemo, useState } from "react";
import type { SiteRow, Status, Strategy } from "@/lib/types";
import ScoreChart from "./ScoreChart";

const STATUS_LABEL: Record<Status, string> = {
  no_ar: "No ar",
  em_andamento: "Em andamento",
};

function formatMs(value: number | null | undefined) {
  if (typeof value !== "number") return "—";
  return `${(value / 1000).toFixed(2)}s`;
}

function formatCls(value: number | null | undefined) {
  if (typeof value !== "number") return "—";
  return value.toFixed(3);
}

function SiteCard({ site, onStatusChange }: { site: SiteRow; onStatusChange: (id: string, status: Status) => void }) {
  const [strategy, setStrategy] = useState<Strategy>("mobile");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(
    () =>
      site.reports
        .filter((r) => r.strategy === strategy && r.error === null)
        .sort((a, b) => new Date(a.ranAt).getTime() - new Date(b.ranAt).getTime()),
    [site.reports, strategy]
  );

  const latest = filtered[filtered.length - 1];

  async function handleStatusChange(next: Status) {
    setSaving(true);
    try {
      await fetch("/api/sites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: site.id, status: next }),
      });
      onStatusChange(site.id, next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6 shadow-sm shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">{site.name}</h2>
          <a
            href={site.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            {site.url}
          </a>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-surface-border bg-surface p-0.5 text-sm">
            {(["mobile", "desktop"] as Strategy[]).map((s) => (
              <button
                key={s}
                onClick={() => setStrategy(s)}
                className={`rounded-md px-3 py-1 transition-colors ${
                  strategy === s ? "bg-indigo-500/20 text-indigo-300" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {s === "mobile" ? "Mobile" : "Desktop"}
              </button>
            ))}
          </div>

          <select
            value={site.status}
            disabled={saving}
            onChange={(e) => handleStatusChange(e.target.value as Status)}
            className={`rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-sm font-medium outline-none ${
              site.status === "no_ar" ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            <option value="no_ar">{STATUS_LABEL.no_ar}</option>
            <option value="em_andamento">{STATUS_LABEL.em_andamento}</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <ScoreChart reports={filtered} />
      </div>

      {latest && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "FCP", value: formatMs(latest.fcpMs) },
            { label: "LCP", value: formatMs(latest.lcpMs) },
            { label: "TBT", value: formatMs(latest.tbtMs) },
            { label: "CLS", value: formatCls(latest.cls) },
            { label: "Speed Index", value: formatMs(latest.speedIndexMs) },
          ].map((vital) => (
            <div key={vital.label} className="rounded-lg bg-surface px-3 py-2 text-center">
              <div className="text-xs text-slate-500">{vital.label}</div>
              <div className="text-sm font-medium text-slate-200">{vital.value}</div>
            </div>
          ))}
        </div>
      )}

      {latest && latest.failedSeoAudits && latest.failedSeoAudits.length > 0 && (
        <details className="mt-5">
          <summary className="cursor-pointer text-sm text-slate-400 hover:text-slate-200">
            {latest.failedSeoAudits.length} auditoria(s) de SEO com falha
          </summary>
          <ul className="mt-2 space-y-1 text-sm text-slate-400">
            {latest.failedSeoAudits.map((audit) => (
              <li key={audit.id} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-rose-400" />
                {audit.title}
              </li>
            ))}
          </ul>
        </details>
      )}

      {filtered.length === 0 && site.reports.some((r) => r.strategy === strategy && r.error) && (
        <p className="mt-4 text-sm text-rose-400">
          Última execução falhou: {site.reports.find((r) => r.strategy === strategy && r.error)?.error}
        </p>
      )}
    </div>
  );
}

export default function Dashboard({ sites }: { sites: SiteRow[] }) {
  const [localSites, setLocalSites] = useState(sites as (SiteRow & { status: Status })[]);

  function handleStatusChange(id: string, status: Status) {
    setLocalSites((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-400">MINO</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-50">Métricas de Sites</h1>
        <p className="mt-2 text-sm text-slate-400">
          Lighthouse via PageSpeed Insights, atualizado toda sexta-feira às 15h (horário de Brasília).
        </p>
      </header>

      <div className="space-y-6">
        {localSites.map((site) => (
          <SiteCard key={site.id} site={site} onStatusChange={handleStatusChange} />
        ))}
      </div>
    </main>
  );
}
