import { explainSeoAudit } from "@/lib/metricExplanations";

export default function FailedSeoAudits({
  audits,
}: {
  audits: { id: string; title: string; weight: number; score: number | null }[];
}) {
  if (audits.length === 0) {
    return (
      <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
        <h3 className="text-sm font-semibold text-slate-700">SEO</h3>
        <p className="mt-2 text-sm text-emerald-600">Nenhuma auditoria de SEO falhou na última análise. 🎉</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
      <h3 className="text-sm font-semibold text-slate-700">
        {audits.length} ponto(s) de SEO para melhorar
      </h3>
      <ul className="mt-3 space-y-3">
        {audits.map((audit) => (
          <li key={audit.id} className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />
            <div>
              <p className="text-sm font-medium text-slate-800">{audit.title}</p>
              <p className="mt-0.5 text-sm text-slate-500">{explainSeoAudit(audit.id, audit.title)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
