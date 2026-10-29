import Link from "next/link";

import type { Status } from "@/lib/types";
import SidebarUserFooter from "./SidebarUserFooter";
import NewFolderForm from "./NewFolderForm";
import WorkspaceTree from "./WorkspaceTree";
import SidebarNav from "./SidebarNav";

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
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col">
      <div className="px-4 pb-3 pt-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-bg-strong-950 text-label-sm text-text-white-0">M</span>
          <span className="text-label-md text-text-strong-950">Métricas</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-px overflow-y-auto px-2 pb-3">
        <p className="px-3 pb-1.5 text-subheading-xs uppercase text-text-soft-400">Geral</p>
        <SidebarNav />

        <p className="px-3 pb-1.5 pt-5 text-subheading-xs uppercase text-text-soft-400">Workspaces</p>
        <WorkspaceTree groups={groups} loose={loose} />
        {isOwner && (
          <NewFolderForm
            sites={sites.map((x) => ({ id: x.id, name: x.name, url: x.url, folderName: folders.find((fo) => fo.id === x.folderId)?.name ?? null }))}
          />
        )}
      </nav>

      <SidebarUserFooter user={user} />
    </aside>
  );
}
