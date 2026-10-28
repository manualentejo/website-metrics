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
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">M</span>
          <span className="text-sm font-semibold tracking-tight text-foreground">Métricas</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-px overflow-y-auto px-2 pb-3">
        <p className="px-2.5 pb-1 text-[11px] font-medium text-muted-foreground">Geral</p>
        {NAV.map(({ key, href, label, icon: Icon }) => (
          <Link
            key={key}
            href={href}
            aria-current={active === key ? "page" : undefined}
            className={`flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors ${
              active === key
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </Link>
        ))}

        <p className="px-2.5 pb-1 pt-5 text-[11px] font-medium text-muted-foreground">Workspaces</p>
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
