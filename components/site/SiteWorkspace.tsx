import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { RiArrowLeftSLine, RiExternalLinkLine } from "@remixicon/react";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { reports } from "@/db/schema";
import AppShell from "@/components/AppShell";
import StatusSelect from "@/components/StatusSelect";
import AskGeminiButton from "@/components/gemini/AskGeminiButton";
import GeminiDrawer from "@/components/gemini/GeminiDrawer";
import RunAuditButton from "@/components/overview/RunAuditButton";
import SiteSwitcher from "./SiteSwitcher";
import { getViewer } from "@/lib/access";
import { visibleSites } from "@/lib/insights";
import { formatDateTime } from "@/lib/format";
import type { Status } from "@/lib/types";

export type SiteTab = "overview" | "seo" | "geo" | "performance" | "analytics" | "competitors" | "history" | "settings";

const MAIN: { key: SiteTab; label: string; path: string }[] = [
  { key: "overview", label: "Visão geral", path: "" },
  { key: "seo", label: "SEO", path: "/seo" },
  { key: "geo", label: "GEO", path: "/geo" },
  { key: "performance", label: "Desempenho", path: "/performance" },
  { key: "analytics", label: "Visitas", path: "/analytics" },
  { key: "competitors", label: "Concorrentes", path: "/competitors" },
];
const SECONDARY: { key: SiteTab; label: string; path: string }[] = [
  { key: "history", label: "Histórico", path: "/history" },
  { key: "settings", label: "Configurações", path: "/settings" },
];

/** Carrega e valida o site (acesso, existência). Usado pelo workspace e por quem precisa do mesmo site. */
export async function requireSite(id: string) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const all = await visibleSites(viewer);
  const site = all.find((s) => s.id === id);
  if (!site) notFound(); // inexistente e sem acesso dão o mesmo 404
  return { viewer, site, all };
}

/**
 * Moldura do contexto individual: cabeçalho do site (identificador, status, última auditoria,
 * executar auditoria, troca rápida de site) + abas. As abas são rotas, então a URL é compartilhável
 * e o botão voltar do navegador funciona.
 */
export default async function SiteWorkspace({
  siteId,
  tab,
  children,
  query = "",
}: {
  siteId: string;
  tab: SiteTab;
  children: ReactNode;
  query?: string;
}) {
  const { viewer, site, all } = await requireSite(siteId);
  const [last] = await db
    .select({ ranAt: reports.ranAt })
    .from(reports)
    .where(and(eq(reports.siteId, siteId), isNull(reports.error)))
    .orderBy(desc(reports.ranAt))
    .limit(1);

  const current = [...MAIN, ...SECONDARY].find((t) => t.key === tab)!;
  const link = (t: { path: string }) => `/site/${siteId}${t.path}${query}`;
  const domain = site.url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const tabCls = (on: boolean) =>
    `relative inline-flex h-10 items-center whitespace-nowrap px-3 text-label-sm transition duration-200 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full ${
      on ? "text-text-strong-950 after:bg-bg-strong-950" : "text-text-sub-600 after:bg-transparent hover:text-text-strong-950"
    }`;

  return (
    <AppShell activeSiteId={siteId}>
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-8">
        <Link href="/" className="mb-3 inline-flex items-center gap-0.5 text-paragraph-xs text-text-sub-600 hover:text-text-strong-950">
          <RiArrowLeftSLine className="size-4" />
          Visão geral
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="flex size-11 flex-shrink-0 items-center justify-center rounded-xl bg-bg-white-0 text-title-h6 uppercase text-text-strong-950 ring-1 ring-inset ring-stroke-soft-200"
            >
              {site.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-title-h6 text-text-strong-950">{site.name}</h1>
              <a href={site.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-paragraph-xs text-text-sub-600 hover:text-text-strong-950">
                {domain}
                <RiExternalLinkLine className="size-3.5" />
              </a>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SiteSwitcher sites={all.map((s) => ({ id: s.id, name: s.name }))} currentId={siteId} tab={current.path} />
            <StatusSelect siteId={site.id} status={site.status as Status} readOnly={!viewer.owner} />
            {viewer.owner && <RunAuditButton sites={[{ id: site.id, name: site.name }]} label="Executar auditoria" />}
            <AskGeminiButton />
          </div>
        </header>
        <p className="mt-2 text-paragraph-xs text-text-soft-400">
          {last ? `Última auditoria: ${formatDateTime(last.ranAt)}` : "Nenhuma auditoria ainda. A primeira roda na próxima sexta às 15h (Brasília), ou use Executar auditoria."}
        </p>

        <nav aria-label="Seções do site" className="-mx-1 mt-4 flex items-center justify-between gap-4 overflow-x-auto border-b border-stroke-soft-200">
          <div className="flex">
            {MAIN.map((t) => (
              <Link key={t.key} href={link(t)} aria-current={tab === t.key ? "page" : undefined} className={tabCls(tab === t.key)}>
                {t.label}
              </Link>
            ))}
          </div>
          <div className="flex">
            {SECONDARY.map((t) => (
              <Link key={t.key} href={link(t)} aria-current={tab === t.key ? "page" : undefined} className={tabCls(tab === t.key)}>
                {t.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-8">{children}</div>
      <GeminiDrawer siteId={site.id} siteName={site.name} />
    </AppShell>
  );
}
