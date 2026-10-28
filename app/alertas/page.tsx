import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Page, EmptyState } from "@/components/ui/Page";
import { getViewer } from "@/lib/access";
import { loadAlerts, type Severity } from "@/lib/insights";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const META: Record<Severity, { label: string; tone: "destructive" | "warning" | "success"; icon: typeof OctagonAlert; color: string }> = {
  critical: { label: "Crítico", tone: "destructive", icon: OctagonAlert, color: "text-destructive" },
  warning: { label: "Atenção", tone: "warning", icon: AlertTriangle, color: "text-warning" },
  good: { label: "Melhorou", tone: "success", icon: CheckCircle2, color: "text-success" },
};

export default async function AlertsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const alerts = await loadAlerts(viewer);

  return (
    <AppShell active="alertas">
      <Page
        title="Alertas"
        subtitle="Notas que caíram 5 pontos ou mais desde a análise anterior, notas abaixo de 50 e carregamento lento."
      >
        {alerts.length === 0 ? (
          <EmptyState title="Nenhum alerta por enquanto">
            Quando uma nota cair ou ficar abaixo de 50, o aviso aparece aqui. Os alertas comparam cada análise com a anterior.
          </EmptyState>
        ) : (
          <Card className="divide-y divide-border">
            {alerts.map((a, i) => {
              const m = META[a.severity];
              return (
                <Link
                  key={i}
                  href={`/site/${a.siteId}?strategy=${a.strategy}`}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-secondary/40"
                >
                  <m.icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${m.color}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-foreground">
                      {a.siteName} · {a.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">{a.detail}</span>
                  </span>
                  <span className="flex flex-shrink-0 flex-col items-end gap-1">
                    <Badge tone={m.tone}>{m.label}</Badge>
                    <span className="text-[11px] text-muted-foreground">{formatDateTime(a.at)}</span>
                  </span>
                </Link>
              );
            })}
          </Card>
        )}
      </Page>
    </AppShell>
  );
}
