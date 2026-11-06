import Link from "next/link";
import { redirect } from "next/navigation";
import { RiCheckboxCircleFill } from "@remixicon/react";

import AppShell from "@/components/AppShell";
import DeviceToggle from "@/components/DeviceToggle";
import IssueList from "@/components/overview/IssueList";
import TaskRow, { type TaskView } from "@/components/overview/TaskRow";
import { Card } from "@/components/ui/Card";
import { Page, Segmented } from "@/components/ui/Page";
import { getViewer } from "@/lib/access";
import { getDevice } from "@/lib/device";
import { getFixMeta, knownAssignees } from "@/lib/fixStatus";
import { loadAlerts, loadTasks, type Alert, type TaskTab } from "@/lib/insights";

export const dynamic = "force-dynamic";

const TABS: { key: TaskTab; label: string }[] = [
  { key: "performance", label: "Desempenho" },
  { key: "accessibility", label: "Acessibilidade" },
  { key: "geo", label: "GEO" },
];

const ALERT_TAB = (a: Alert): TaskTab => (a.category === "Acessibilidade" ? "accessibility" : "performance");

/** Fila única de problemas: abas por tipo, ordenada pelo peso na nota, com gravidade, status e responsável. */
export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ tab?: string; sev?: string; st?: string }> }) {
  const sp = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const device = await getDevice();
  const tab = TABS.find((t) => t.key === sp.tab)?.key ?? "performance";
  const sev = sp.sev === "critical" || sp.sev === "warning" ? sp.sev : "";
  const showDone = sp.st === "done";

  const [tasks, alerts, meta, people] = await Promise.all([
    loadTasks(viewer, device),
    loadAlerts(viewer),
    getFixMeta().catch(() => new Map()),
    knownAssignees().catch(() => [] as string[]),
  ]);

  const withMeta: TaskView[] = tasks.map((t) => ({
    key: t.key,
    siteId: t.siteId,
    siteName: t.siteName,
    siteUrl: t.siteUrl,
    tab: t.tab,
    title: t.title,
    detail: t.detail,
    plain: t.plain,
    severity: t.severity,
    href: t.href,
    status: meta.get(t.key)?.status ?? "todo",
    assignee: meta.get(t.key)?.assignee ?? null,
  }));

  const openCount = (k: TaskTab) => withMeta.filter((t) => t.tab === k && t.status !== "done").length;
  const list = withMeta.filter((t) => t.tab === tab && (!sev || t.severity === sev) && (showDone ? t.status === "done" : t.status !== "done"));
  const tabAlerts = tab === "geo" || showDone ? [] : alerts.filter((a) => a.strategy === device && a.severity !== "good" && ALERT_TAB(a) === tab && (!sev || a.severity === sev));

  const href = (over: Record<string, string | null>) => {
    const q = new URLSearchParams();
    const cur: Record<string, string | undefined> = { tab: tab === "performance" ? undefined : tab, sev: sev || undefined, st: showDone ? "done" : undefined };
    for (const [k, v] of Object.entries({ ...cur, ...over })) if (v) q.set(k, v);
    return q.toString() ? `/alertas?${q}` : "/alertas";
  };
  const tabCls = (on: boolean) =>
    `relative inline-flex h-10 items-center gap-2 whitespace-nowrap px-3 text-label-sm transition duration-200 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full ${
      on ? "text-text-strong-950 after:bg-bg-strong-950" : "text-text-sub-600 after:bg-transparent hover:text-text-strong-950"
    }`;

  return (
    <AppShell active="alertas">
      <Page title="Alertas" actions={<DeviceToggle value={device} />}>
        <nav aria-label="Tipo de alerta" className="-mx-1 -mt-2 flex overflow-x-auto border-b border-stroke-soft-200">
          {TABS.map((t) => (
            <Link key={t.key} href={href({ tab: t.key === "performance" ? null : t.key })} aria-current={tab === t.key ? "page" : undefined} className={tabCls(tab === t.key)}>
              {t.label}
              <span className="rounded-full bg-bg-soft-200 px-1.5 text-label-xs tabular-nums text-text-sub-600">{openCount(t.key)}</span>
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Gravidade"
            items={[
              { label: "Todas", href: href({ sev: null }), active: !sev },
              { label: "Crítico", href: href({ sev: "critical" }), active: sev === "critical" },
              { label: "Atenção", href: href({ sev: "warning" }), active: sev === "warning" },
            ]}
          />
          <Segmented
            label="Status"
            items={[
              { label: "Abertas", href: href({ st: null }), active: !showDone },
              { label: "Feitas", href: href({ st: "done" }), active: showDone },
            ]}
          />
        </div>

        {tabAlerts.length > 0 && (
          <section>
            <h2 className="mb-2 text-label-md text-text-strong-950">Mudanças de nota</h2>
            <IssueList issues={tabAlerts} />
          </section>
        )}

        {list.length === 0 ? (
          tabAlerts.length === 0 && (
            <div className="flex items-center gap-3 rounded-xl bg-success-lighter px-4 py-5 text-paragraph-sm text-text-strong-950">
              <RiCheckboxCircleFill className="size-5 text-success-base" />
              {showDone ? "Nenhuma tarefa marcada como feita." : "Nada para corrigir aqui agora."}
            </div>
          )
        ) : (
          <section>
            {tabAlerts.length > 0 && <h2 className="mb-2 text-label-md text-text-strong-950">Fila de correções</h2>}
            <Card>
              <ul className="divide-y divide-stroke-soft-200">
                {list.slice(0, 60).map((t, i) => (
                  <TaskRow key={t.key} task={t} index={i + 1} people={people} canEdit />
                ))}
              </ul>
            </Card>
          </section>
        )}
      </Page>
    </AppShell>
  );
}
