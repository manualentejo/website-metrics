import Link from "next/link";
import { LayoutDashboard, Settings } from "lucide-react";
import type { Status } from "@/lib/types";
import SidebarUserFooter from "./SidebarUserFooter";
import NewFolderForm from "./NewFolderForm";
import WorkspaceTree from "./WorkspaceTree";

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "no_ar", label: "No ar" },
  { value: "em_andamento", label: "Em andamento" },
];

interface SiteNavItem {
  id: string;
  name: string;
  status: Status;
  folderId: string | null;
}

export default function Sidebar({
  sites,
  folders,
  activeSiteId,
  activeFolderId,
  statusFilter,
  userEmail,
  isOwner,
  settingsActive,
}: {
  sites: SiteNavItem[];
  folders: { id: string; name: string }[];
  activeSiteId?: string;
  activeFolderId?: string;
  statusFilter?: string;
  userEmail?: string;
  isOwner?: boolean;
  settingsActive?: boolean;
}) {
  const shown = statusFilter ? sites.filter((s) => s.status === statusFilter) : sites;
  const groups = folders
    .map((f) => ({ id: f.id, name: f.name, sites: shown.filter((s) => s.folderId === f.id) }))
    .filter((g) => isOwner || g.sites.length > 0);
  const loose = shown.filter((s) => !s.folderId || !folders.some((f) => f.id === s.folderId));

  const item = (active: boolean) =>
    `flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-[13px] transition-colors ${
      active ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"
    }`;
  const home = !activeSiteId && !activeFolderId && !settingsActive;

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col border-r border-border bg-surface-sidebar">
      <div className="px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground">M</span>
          <span className="text-[15px] font-semibold tracking-tight text-foreground">Métricas</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">Geral</p>
        <Link href="/" className={item(home)}>
          <LayoutDashboard className="h-4 w-4" />
          Visão geral
        </Link>
        {isOwner && (
          <Link href="/settings" className={item(Boolean(settingsActive))}>
            <Settings className="h-4 w-4" />
            Configurações
          </Link>
        )}

        <div className="mt-4 flex flex-wrap gap-1 px-1">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value ? `/?status=${f.value}` : "/"}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                (statusFilter ?? "") === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <p className="mt-5 px-3 pb-1 text-xs font-medium text-muted-foreground">Workspaces</p>
        <WorkspaceTree groups={groups} loose={loose} activeSiteId={activeSiteId} activeFolderId={activeFolderId} />
        {shown.length === 0 && folders.length === 0 && (
          <p className="px-3 py-2 text-[13px] text-muted-foreground">Nenhum site nesse filtro.</p>
        )}
        {isOwner && (
          <div className="mt-1">
            <NewFolderForm />
          </div>
        )}
      </nav>

      {userEmail && <SidebarUserFooter email={userEmail} />}
    </aside>
  );
}
