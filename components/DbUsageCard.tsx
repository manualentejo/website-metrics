"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";

interface Usage {
  provider: string;
  totalBytes: number;
  limitBytes: number | null;
  tables: { name: string; bytes: number; rows: number | null }[];
  snapshotParts: { screenshots: number; thumbnails: number; analysis: number } | null;
}

const LABEL: Record<string, string> = {
  snapshots: "Análise completa e prints (a mais recente de cada site)",
  reports: "Histórico semanal de notas",
  pageviews: "Visitas contadas pelo código de rastreio",
  geo_runs: "Respostas das IAs na verificação de visibilidade",
  geo_audits: "Auditorias GEO",
  geo_prompts: "Prompts de GEO",
  geo_settings: "Configuração de GEO",
  site_icons: "Ícones dos sites",
  sites: "Cadastro de sites",
  folders: "Workspaces",
  site_access: "Compartilhamento de sites",
  profiles: "Perfis",
  settings: "Configurações",
};

const mb = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

/** Quanto do banco está em uso e o que ocupa o espaço. Só o dono vê. */
export default function DbUsageCard() {
  const [data, setData] = useState<Usage | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/db-usage")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const pct = data?.limitBytes ? Math.min(100, (data.totalBytes / data.limitBytes) * 100) : null;
  return (
    <Card>
      <CardHeader title="Uso do banco de dados" description="O que ocupa o espaço do plano gratuito." />
      <div className="space-y-4 p-5">
        {error && <p className="text-paragraph-sm text-error-base">Não foi possível medir o banco agora.</p>}
        {!data && !error && <p className="text-paragraph-sm text-text-sub-600">Medindo…</p>}
        {data && (
          <>
            <div>
              <p className="text-label-md text-text-strong-950">
                {mb(data.totalBytes)}
                {data.limitBytes ? ` de ${mb(data.limitBytes)}` : ""}
                <span className="ml-2 text-paragraph-sm font-normal text-text-sub-600">
                  {pct !== null ? `${pct.toFixed(1).replace(".", ",")}% do plano gratuito (${data.provider})` : `provedor ${data.provider}`}
                </span>
              </p>
              {pct !== null && (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-weak-50">
                  <div className={`h-full rounded-full ${pct > 85 ? "bg-error-base" : pct > 60 ? "bg-warning-base" : "bg-success-base"}`} style={{ width: `${Math.max(pct, 1)}%` }} />
                </div>
              )}
            </div>
            <ul className="divide-y divide-stroke-soft-200 text-paragraph-sm">
              {data.tables.filter((t) => t.bytes >= 8192 || (t.rows ?? 0) > 0).map((t) => (
                <li key={t.name} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-text-strong-950">{LABEL[t.name] ?? t.name}</span>
                    <span className="block text-paragraph-xs text-text-sub-600">{t.rows !== null ? `${t.rows.toLocaleString("pt-BR")} registros` : ""}</span>
                  </span>
                  <span className="flex-shrink-0 tabular-nums text-text-strong-950">{mb(t.bytes)}</span>
                </li>
              ))}
            </ul>
            {data.snapshotParts && (
              <p className="text-paragraph-xs text-text-sub-600">
                Dentro da análise completa: prints {mb(data.snapshotParts.screenshots)}, miniaturas {mb(data.snapshotParts.thumbnails)} e dados do Lighthouse {mb(data.snapshotParts.analysis)}.
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
