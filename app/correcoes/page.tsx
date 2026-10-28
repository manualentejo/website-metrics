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
        subtitle="Problemas encontrados no celular, do que mais pesa na nota para o que menos pesa. Abra o site e use “Pergunte ao Gemini” para o passo a passo no Framer."
      >
        {items.length === 0 ? (
          <EmptyState title="Nada para corrigir agora">
            Assim que houver uma análise detalhada, os problemas aparecem aqui já ordenados por impacto.
          </EmptyState>
        ) : (
          <Card className="divide-y divide-border">
            {items.map((it, i) => (
              <Link
                key={`${it.siteId}-${it.auditId}`}
                href={`/site/${it.siteId}?strategy=mobile`}
                className="flex items-start gap-4 px-5 py-3 hover:bg-secondary/40"
              >
                <span className="w-5 flex-shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-foreground">{it.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {it.siteName}
                    {it.displayValue ? ` · ${it.displayValue}` : ""}
                  </span>
                  {it.plain && <span className="mt-1 block text-xs text-muted-foreground">{it.plain}</span>}
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
