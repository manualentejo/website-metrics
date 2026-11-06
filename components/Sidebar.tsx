import Link from "next/link";

import type { Status } from "@/lib/types";
import SidebarUserFooter from "./SidebarUserFooter";
import NewFolderForm from "./NewFolderForm";
import WorkspaceTree from "./WorkspaceTree";
import SidebarNav from "./SidebarNav";
import { SidebarCollapseButton } from "./SidebarFrame";

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
  isOwner,
  user,
}: {
  sites: SiteNavItem[];
  folders: { id: string; name: string }[];
  isOwner?: boolean;
  user: { email: string; name: string; image: string | null };
}) {
  const groups = folders
    .map((f) => ({ id: f.id, name: f.name, sites: sites.filter((s) => s.folderId === f.id) }))
    .filter((g) => isOwner || g.sites.length > 0);
  const loose = sites.filter((s) => !s.folderId || !folders.some((f) => f.id === s.folderId));

  return (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col transition-[width] duration-200 group-data-[collapsed=true]/sb:w-[72px]">
      <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-4 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-2">
        <Link href="/" aria-label="Métricas: início" className="flex min-w-0 items-center gap-2.5 group-data-[collapsed=true]/sb:hidden">
          <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-bg-strong-950 text-label-sm text-text-white-0">M</span>
          <span className="truncate text-label-md text-text-strong-950 group-data-[collapsed=true]/sb:hidden">Métricas</span>
        </Link>
        <SidebarCollapseButton />
      </div>

      <nav className="flex-1 space-y-px overflow-y-auto px-2 pb-3">
        <p className="px-3 pb-1.5 text-subheading-xs uppercase text-text-soft-400 group-data-[collapsed=true]/sb:hidden">Geral</p>
        <SidebarNav />

        <p className="px-3 pb-1.5 pt-5 text-subheading-xs uppercase text-text-soft-400 group-data-[collapsed=true]/sb:hidden">Workspaces</p>
        <div className="mx-3 my-2 hidden border-t border-stroke-soft-200 group-data-[collapsed=true]/sb:block" />
        <WorkspaceTree groups={groups} loose={loose} canReorder={!!isOwner} />
        {isOwner && (
          <div className="group-data-[collapsed=true]/sb:hidden">
          <NewFolderForm
            sites={sites.map((x) => ({ id: x.id, name: x.name, url: x.url, folderName: folders.find((fo) => fo.id === x.folderId)?.name ?? null }))}
          />
          </div>
        )}
      </nav>

      <SidebarUserFooter user={user} />
    </aside>
  );
}
