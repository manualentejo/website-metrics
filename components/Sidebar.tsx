import Link from "next/link";
import { FolderClosed, Globe, LayoutDashboard } from "lucide-react";
import type { Status } from "@/lib/types";
import SidebarUserFooter from "./SidebarUserFooter";
import NewFolderForm from "./NewFolderForm";

const STATUS_DOT: Record<Status, string> = {
  no_ar: "bg-success",
  em_andamento: "bg-warning",
};

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
  statusFilter,
  userEmail,
  isOwner,
}: {
  sites: SiteNavItem[];
  folders: { id: string; name: string }[];
  activeSiteId?: string;
  statusFilter?: string;
  userEmail?: string;
  isOwner?: boolean;
}) {
  const filtered = statusFilter ? sites.filter((s) => s.status === statusFilter) : sites;
  const groups = [
    ...folders.map((f) => ({ id: f.id, name: f.name, sites: filtered.filter((s) => s.folderId === f.id) })),
    { id: "none", name: "Sem pasta", sites: filtered.filter((s) => s.folderId === null) },
  ].filter((g) => g.sites.length > 0 || (g.id !== "none" && !statusFilter));

  const itemClass = (active: boolean) =>
    `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
      active ? "bg-card font-medium text-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"
    }`;

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-border bg-surface-sidebar">
      <div className="px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">M</span>
          <span className="text-base font-semibold tracking-tight text-foreground">MINO Métricas</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">Principal</p>
        <Link href="/" className={itemClass(!activeSiteId)}>
          <LayoutDashboard className="h-4 w-4" />
          Visão geral
        </Link>

        <div className="mt-5 flex flex-wrap gap-1 px-1">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value ? `/?status=${f.value}` : "/"}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
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
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group.id}>
              {group.id !== "none" && (
                <p className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-foreground">
                  <FolderClosed className="h-4 w-4 text-muted-foreground" />
                  {group.name}
                </p>
              )}
              <div className={group.id !== "none" ? "ml-5 space-y-0.5 border-l border-border pl-2" : "space-y-0.5"}>
                {group.sites.map((site) => (
                  <Link key={site.id} href={`/site/${site.id}`} className={itemClass(site.id === activeSiteId)}>
                    <Globe className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{site.name}</span>
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[site.status]}`} title={site.status === "no_ar" ? "No ar" : "Em andamento"} />
                  </Link>
                ))}
                {group.sites.length === 0 && <p className="px-3 py-1 text-xs text-muted-foreground">Pasta vazia</p>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && folders.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum site nesse filtro.</p>
          )}
        </div>
        {isOwner && (
          <div className="mt-2">
            <NewFolderForm />
          </div>
        )}
      </nav>

      {userEmail && <SidebarUserFooter email={userEmail} />}
    </aside>
  );
}
