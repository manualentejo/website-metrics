import { RiAlertLine, RiCheckboxCircleLine, RiErrorWarningLine } from "@remixicon/react";
import Link from "next/link";
import { redirect } from "next/navigation";

import AppShell from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Page, EmptyState } from "@/components/ui/Page";
import { getViewer } from "@/lib/access";
import { loadAlerts, type Severity } from "@/lib/insights";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const META: Record<Severity, { label: string; tone: "destructive" | "warning" | "success"; icon: typeof RiErrorWarningLine; color: string }> = {
  critical: { label: "Crítico", tone: "destructive", icon: RiErrorWarningLine, color: "text-error-base" },
  warning: { label: "Atenção", tone: "warning", icon: RiAlertLine, color: "text-warning-base" },
  good: { label: "Melhorou", tone: "success", icon: RiCheckboxCircleLine, color: "text-success-base" },
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
          <Card className="divide-y divide-stroke-soft-200">
            {alerts.map((a, i) => {
              const m = META[a.severity];
              return (
                <Link
                  key={i}
                  href={a.href}
                  className="flex items-start gap-3 px-5 py-3 hover:bg-bg-weak-50"
                >
                  <m.icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${m.color}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-paragraph-sm font-medium text-text-strong-950">
                      {a.siteName} · {a.title}
                    </span>
                    <span className="block text-paragraph-xs text-text-sub-600">{a.detail}</span>
                  </span>
                  <span className="flex flex-shrink-0 flex-col items-end gap-1">
                    <Badge tone={m.tone}>{m.label}</Badge>
                    <span className="text-paragraph-xs text-text-sub-600">{formatDateTime(a.at)}</span>
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
