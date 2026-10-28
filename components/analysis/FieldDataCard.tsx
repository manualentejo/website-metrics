import { RiGroupLine } from "@remixicon/react";
import { Card, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { FieldData } from "@/lib/analysis";

const LABEL: Record<FieldData["metrics"][number]["id"], { title: string; hint: string }> = {
  lcp: { title: "Carregamento do conteúdo principal (LCP)", hint: "Quanto tempo a parte principal da página leva para aparecer." },
  inp: { title: "Resposta ao toque ou clique (INP)", hint: "Quanto o site demora para reagir quando a pessoa interage." },
  cls: { title: "Estabilidade do layout (CLS)", hint: "Se os elementos pulam de lugar enquanto a página carrega." },
  fcp: { title: "Primeira exibição de conteúdo (FCP)", hint: "Quando algo aparece na tela pela primeira vez." },
  ttfb: { title: "Resposta do servidor (TTFB)", hint: "Quanto o servidor demora para começar a responder." },
};

const VERDICT = {
  FAST: { text: "Boa", tone: "success" },
  AVERAGE: { text: "Precisa melhorar", tone: "warning" },
  SLOW: { text: "Ruim", tone: "destructive" },
} as const;

function format(id: string, v: number) {
  if (id === "cls") return v.toFixed(2).replace(".", ",");
  if (id === "inp") return `${Math.round(v)} ms`;
  return v >= 1000 ? `${(v / 1000).toFixed(1).replace(".", ",")} s` : `${Math.round(v)} ms`;
}

// Experiência de pessoas reais, medida pelo Google (Chrome UX Report). Não é contagem de visitas.
export default function FieldDataCard({ field }: { field: FieldData | null | undefined }) {
  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <RiGroupLine className="h-4 w-4 text-text-sub-600" />
            Usuários reais
          </span>
        }
        description="Como pessoas de verdade carregam o site, medido pelo Google nos últimos 28 dias."
        action={field?.overall && <Badge tone={VERDICT[field.overall].tone}>{VERDICT[field.overall].text}</Badge>}
      />
      <div className="p-5 pt-3">
        {field === undefined && (
          <p className="text-paragraph-sm text-text-sub-600">
            Esta análise é anterior a este recurso. Em Configurar › “Analisar de novo”, ou na próxima análise semanal, os dados aparecem aqui.
          </p>
        )}
        {field === null && (
          <p className="text-paragraph-sm text-text-sub-600">
            O Google ainda não tem dados de usuários reais para este site, em geral porque ele recebe poucos acessos. Quando tiver, aparecem aqui.
          </p>
        )}
        {field && (
          <>
            <ul className="divide-y divide-stroke-soft-200">
              {field.metrics.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <span className="min-w-0">
                    <span className="block text-paragraph-sm font-medium text-text-strong-950">{LABEL[m.id].title}</span>
                    <span className="block text-paragraph-xs text-text-sub-600">{LABEL[m.id].hint}</span>
                  </span>
                  <span className="flex flex-shrink-0 items-center gap-3">
                    <span className="text-paragraph-sm font-medium tabular-nums">{format(m.id, m.value)}</span>
                    {m.category && <Badge tone={VERDICT[m.category].tone}>{VERDICT[m.category].text}</Badge>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-paragraph-xs text-text-sub-600">
              {field.scope === "origin"
                ? "Dados do domínio inteiro: a página sozinha não tem acessos suficientes para o Google medir."
                : "Dados desta página."}{" "}
              São do tempo de carregamento, não do número de visitas.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
