import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Page, EmptyState } from "@/components/ui/Page";
import { getViewer } from "@/lib/access";
import { loadFixQueue } from "@/lib/insights";

export const dynamic = "force-dynamic";

export default async function FixQueuePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const items = (await loadFixQueue(viewer)).slice(0, 40);

  return (
    <AppShell active="correcoes">
      <Page
        title="Fila de correções"
        subtitle="Problemas encontrados no computador, do que mais pesa na nota para o que menos pesa. Abra o site e use “Pergunte ao Gemini” para o passo a passo no Framer."
      >
        {items.length === 0 ? (
          <EmptyState title="Nada para corrigir agora">
            Assim que houver uma análise detalhada, os problemas aparecem aqui já ordenados por impacto.
          </EmptyState>
        ) : (
          <Card className="divide-y divide-stroke-soft-200">
            {items.map((it, i) => (
              <Link
                key={`${it.siteId}-${it.auditId}`}
                href={`/site/${it.siteId}?strategy=desktop`}
                className="flex items-start gap-4 px-5 py-3 hover:bg-bg-weak-50"
              >
                <span className="w-5 flex-shrink-0 pt-0.5 text-paragraph-xs tabular-nums text-text-sub-600">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-paragraph-sm font-medium text-text-strong-950">{it.title}</span>
                  <span className="block text-paragraph-xs text-text-sub-600">
                    {it.siteName}
                    {it.displayValue ? ` · ${it.displayValue}` : ""}
                  </span>
                  {it.plain && <span className="mt-1 block text-paragraph-xs text-text-sub-600">{it.plain}</span>}
                </span>
                <Badge tone={it.status === "fail" ? "destructive" : "warning"}>
                  {it.status === "fail" ? "Reprovado" : "Pode melhorar"}
                </Badge>
              </Link>
            ))}
          </Card>
        )}
      </Page>
    </AppShell>
  );
}
