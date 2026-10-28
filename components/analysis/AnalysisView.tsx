"use client";

import { useState } from "react";
import type { Analysis, AuditStatus, CategoryKey, StoredAudit } from "@/lib/analysis";
import { auditStatus } from "@/lib/analysis";
import type { ReportRow } from "@/lib/types";
import { GLOSSARY } from "@/lib/glossary";
import ScoreGauge from "@/components/ScoreGauge";
import ScoreChart from "@/components/ScoreChart";
import Filmstrip from "@/components/Filmstrip";
import InfoTip from "@/components/ui/InfoTip";
import { Card, CardHeader } from "@/components/ui/Card";
import AuditSection from "./AuditSection";
import MetricsPanel from "./MetricsPanel";

const STATUS_ORDER: Record<AuditStatus, number> = { fail: 0, average: 1, info: 2, manual: 3, pass: 4, na: 5 };

type Item = { id: string; audit: StoredAudit; weight: number };

function itemsFor(analysis: Analysis, key: CategoryKey) {
  return analysis.categories[key].auditRefs
    .map((ref) => ({ id: ref.id, audit: analysis.audits[ref.id], weight: ref.weight, group: ref.group }))
    .filter((i): i is Item & { group: string | null } => Boolean(i.audit));
}

function sortByStatus(items: Item[]) {
  return [...items].sort(
    (a, b) => STATUS_ORDER[auditStatus(a.audit)] - STATUS_ORDER[auditStatus(b.audit)] || b.weight - a.weight
  );
}

const pct = (s: number | null) => (s === null ? null : Math.round(s * 100));

export default function AnalysisView({
  analysis,
  finalScreenshot,
  thumbnails,
  history,
  siteName,
  strategyLabel,
}: {
  analysis: Analysis;
  finalScreenshot: string | null;
  thumbnails: { timing: number; data: string }[];
  history: ReportRow[];
  siteName: string;
  strategyLabel: string;
}) {
  const [tab, setTab] = useState<CategoryKey>("performance");
  const common = { siteName, strategyLabel };

  return (
    <div className="space-y-6">
      <Card>
        <div
          role="tablist"
          aria-label="Categorias da análise"
          className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-4"
        >
          {(["performance", "accessibility", "best-practices", "seo"] as CategoryKey[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              onClick={() => setTab(key)}
              aria-selected={tab === key}
              className={`flex flex-col items-center gap-1 px-4 pb-3 pt-5 transition-colors hover:bg-secondary ${
                tab === key ? "bg-secondary" : "bg-card"
              }`}
            >
              <ScoreGauge score={pct(analysis.categories[key].score)} label="" size={76} />
              <span className={`text-sm font-medium ${tab === key ? "text-foreground" : "text-muted-foreground"}`}>
                {GLOSSARY[key]?.title ?? analysis.categories[key].title}
              </span>
              <span className={`mt-1 h-0.5 w-10 rounded-full ${tab === key ? "bg-primary" : "bg-transparent"}`} />
            </button>
          ))}
        </div>
      </Card>

      {tab === "performance" ? (
        <PerformanceTab analysis={analysis} finalScreenshot={finalScreenshot} thumbnails={thumbnails} {...common} />
      ) : (
        <CategoryTab key={tab} analysis={analysis} category={tab} {...common} />
      )}

      <Card>
        <CardHeader
          title="Evolução das notas"
          description="Uma análise por semana, mantendo até 52 semanas."
          info={
            <InfoTip
              title="Histórico"
              text="Cada ponto é uma análise automática de sexta-feira. Use para ver se as mudanças no site melhoraram ou pioraram as notas."
            />
          }
        />
        <div className="px-6 pb-6 pt-4">
          <ScoreChart reports={history} />
        </div>
      </Card>
    </div>
  );
}

function CategoryIntro({ category, score }: { category: CategoryKey; score: number | null }) {
  const g = GLOSSARY[category];
  const verdict =
    score === null ? null : score >= 90 ? "Bom" : score >= 50 ? "Precisa melhorar" : "Ruim";
  const verdictClass =
    score === null ? "" : score >= 90 ? "bg-success/10 text-success" : score >= 50 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive";
  return (
    <div className="px-6 py-5">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-foreground">{g?.title}</h2>
        {verdict && <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${verdictClass}`}>{verdict}</span>}
      </div>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">{g?.text}</p>
    </div>
  );
}

function PerformanceTab({
  analysis,
  finalScreenshot,
  thumbnails,
  siteName,
  strategyLabel,
}: {
  analysis: Analysis;
  finalScreenshot: string | null;
  thumbnails: { timing: number; data: string }[];
  siteName: string;
  strategyLabel: string;
}) {
  const all = itemsFor(analysis, "performance");
  const notPassed = (i: Item) => !["pass", "na"].includes(auditStatus(i.audit));
  const insights = sortByStatus(all.filter((i) => i.group === "insights" && notPassed(i)));
  const diagnostics = sortByStatus(all.filter((i) => i.group === "diagnostics" && notPassed(i)));
  const passed = all.filter(
    (i) => (i.group === "insights" || i.group === "diagnostics") && auditStatus(i.audit) === "pass"
  );
  const common = { siteName, strategyLabel };

  return (
    <div className="space-y-6">
      <Card>
        <CategoryIntro category="performance" score={pct(analysis.categories.performance.score)} />
        <div className="flex flex-wrap justify-center gap-5 border-t border-border px-6 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M6 1 11.5 11H.5z" fill="#e11d48" /></svg>0–49 ruim</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 bg-warning/100" />50–89 precisa melhorar</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-success/100" />90–100 bom</span>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Métricas"
          description="Os 5 tempos que formam a nota de desempenho."
          info={<InfoTip term="lab-data" />}
        />
        <div className="mt-4 overflow-hidden rounded-b-2xl border-t border-border">
          <MetricsPanel analysis={analysis} />
        </div>
      </Card>

      <Filmstrip finalScreenshot={finalScreenshot} thumbnails={thumbnails} />

      <Card className="overflow-hidden">
        <AuditSection
          title={analysis.groups.insights?.title ?? "Insights"}
          infoTerm="insights"
          items={insights}
          {...common}
        />
        <AuditSection
          title={analysis.groups.diagnostics?.title ?? "Diagnóstico"}
          infoTerm="diagnostics"
          items={diagnostics}
          {...common}
        />
        <AuditSection title="Auditorias aprovadas" infoTerm="passed" items={passed} collapsible defaultOpen={false} {...common} />
      </Card>
    </div>
  );
}

function CategoryTab({
  analysis,
  category,
  siteName,
  strategyLabel,
}: {
  analysis: Analysis;
  category: CategoryKey;
  siteName: string;
  strategyLabel: string;
}) {
  const all = itemsFor(analysis, category);
  const failing = all.filter((i) => ["fail", "average"].includes(auditStatus(i.audit)));
  const info = all.filter((i) => auditStatus(i.audit) === "info");
  const manual = all.filter((i) => auditStatus(i.audit) === "manual");
  const passed = all.filter((i) => auditStatus(i.audit) === "pass");
  const na = all.filter((i) => auditStatus(i.audit) === "na");
  const common = { siteName, strategyLabel };

  const groupOrder: string[] = [];
  const byGroup = new Map<string, Item[]>();
  for (const item of sortByStatus(failing)) {
    const g = (item as Item & { group: string | null }).group ?? "_other";
    if (!byGroup.has(g)) {
      byGroup.set(g, []);
      groupOrder.push(g);
    }
    byGroup.get(g)!.push(item);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CategoryIntro category={category} score={pct(analysis.categories[category].score)} />
      </Card>

      <Card className="overflow-hidden">
        {failing.length === 0 && (
          <p className="px-6 py-5 text-sm text-success">Nenhum problema encontrado nesta categoria.</p>
        )}
        {groupOrder.map((g) => (
          <AuditSection
            key={g}
            title={g === "_other" ? "Outros" : analysis.groups[g]?.title ?? g}
            description={g === "_other" ? null : analysis.groups[g]?.description}
            items={byGroup.get(g)!}
            {...common}
          />
        ))}
        <AuditSection title="Informativos" items={info} collapsible defaultOpen={false} {...common} />
        <AuditSection title="Verificação manual" infoTerm="manual" items={manual} collapsible defaultOpen={false} {...common} />
        <AuditSection title="Auditorias aprovadas" infoTerm="passed" items={passed} collapsible defaultOpen={false} {...common} />
        <AuditSection title="Não aplicável" infoTerm="not-applicable" items={na} collapsible defaultOpen={false} {...common} />
      </Card>
    </div>
  );
}
