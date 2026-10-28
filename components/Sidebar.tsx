import { RiDashboardLine, RiGlobalLine, RiFileList3Line, RiNotification3Line, RiScalesLine, RiToolsLine, RiCalendarLine } from "@remixicon/react";
import type { ComponentType } from "react";
import Link from "next/link";

import type { Status } from "@/lib/types";
import SidebarUserFooter from "./SidebarUserFooter";
import NewFolderForm from "./NewFolderForm";
import WorkspaceTree from "./WorkspaceTree";

export type NavKey = "home" | "sites" | "analises" | "alertas" | "comparativo" | "correcoes" | "relatorios" | "perfil";

const NAV: { key: NavKey; href: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: "home", href: "/", label: "Visão geral", icon: RiDashboardLine },
  { key: "sites", href: "/sites", label: "Sites", icon: RiGlobalLine },
  { key: "analises", href: "/analises", label: "Análises", icon: RiFileList3Line },
  { key: "alertas", href: "/alertas", label: "Alertas", icon: RiNotification3Line },
  { key: "comparativo", href: "/comparativo", label: "Comparativo", icon: RiScalesLine },
  { key: "correcoes", href: "/correcoes", label: "Fila de correções", icon: RiToolsLine },
  { key: "relatorios", href: "/relatorios", label: "Relatórios", icon: RiCalendarLine },
];

interface SiteNavItem {
  id: string;
  name: string;
  url: string;
  status: Status;
  folderId: string | null;
}

export default function Sidebar({
  sites,
  folders,
  active,
  activeSiteId,
  activeFolderId,
  isOwner,
  user,
}: {
  sites: SiteNavItem[];
  folders: { id: string; name: string }[];
  active?: NavKey;
  activeSiteId?: string;
  activeFolderId?: string;
  isOwner?: boolean;
  user: { email: string; name: string; image: string | null };
}) {
  const groups = folders
    .map((f) => ({ id: f.id, name: f.name, sites: sites.filter((s) => s.folderId === f.id) }))
    .filter((g) => isOwner || g.sites.length > 0);
  const loose = sites.filter((s) => !s.folderId || !folders.some((f) => f.id === s.folderId));

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col">
      <div className="px-4 pb-3 pt-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-bg-strong-950 text-label-sm text-text-white-0">M</span>
          <span className="text-label-md text-text-strong-950">Métricas</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-px overflow-y-auto px-2 pb-3">
        <p className="px-3 pb-1.5 text-subheading-xs uppercase text-text-soft-400">Geral</p>
        {NAV.map(({ key, href, label, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            aria-current={active === key ? "page" : undefined}
            className={`flex h-9 items-center gap-2 rounded-lg px-3 text-label-sm transition duration-200 ${
              active === key
                ? "bg-bg-weak-50 text-text-strong-950"
                : "text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950"
            }`}
          >
            <Icon className="size-5 flex-shrink-0" />
            {label}
          </Link>
        ))}

        <p className="px-3 pb-1.5 pt-5 text-subheading-xs uppercase text-text-soft-400">Workspaces</p>
        <WorkspaceTree groups={groups} loose={loose} activeSiteId={activeSiteId} activeFolderId={activeFolderId} />
        {isOwner && (
          <NewFolderForm
            sites={sites.map((x) => ({ id: x.id, name: x.name, url: x.url, folderName: folders.find((fo) => fo.id === x.folderId)?.name ?? null }))}
          />
        )}
      </nav>

      <SidebarUserFooter user={user} active={active === "perfil"} />
    </aside>
  );
}
