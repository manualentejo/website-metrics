import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { sites, folders } from "@/db/schema";
import Sidebar, { type NavKey } from "./Sidebar";
import { getViewer, getAccessibleSiteIds, canViewSite } from "@/lib/access";
import { getProfile } from "@/lib/profile";
import type { Status } from "@/lib/types";

// Moldura comum: barra lateral + painel branco com o conteúdo da página.
export default async function AppShell({
  children,
  active,
  activeSiteId,
  activeFolderId,
  aside,
}: {
  children: ReactNode;
  active?: NavKey;
  activeSiteId?: string;
  activeFolderId?: string;
  aside?: ReactNode;
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const accessible = viewer.owner ? new Set<string>() : await getAccessibleSiteIds(viewer.email);
  const [allSites, allFolders, profile] = await Promise.all([
    db.select().from(sites).orderBy(asc(sites.sortOrder), asc(sites.createdAt)),
    db.select().from(folders).orderBy(asc(folders.sortOrder), asc(folders.createdAt)),
    getProfile(viewer.email),
  ]);
  const visible = allSites.filter((s) => canViewSite(viewer, s, accessible, s.id));

  return (
    <div className="flex h-screen bg-bg-white-0">
      <Sidebar
        sites={visible.map((s) => ({ id: s.id, name: s.name, url: s.url, status: s.status as Status, folderId: s.folderId }))}
        folders={allFolders}
        active={active}
        activeSiteId={activeSiteId}
        activeFolderId={activeFolderId}
        isOwner={viewer.owner}
        user={{
          email: viewer.email,
          name: profile.name ?? viewer.name ?? viewer.email.split("@")[0],
          image: profile.image ?? viewer.image ?? null,
        }}
      />
      <main className="my-2 mr-2 flex-1 overflow-y-auto rounded-2xl bg-bg-weak-50 ring-1 ring-inset ring-stroke-soft-200">{children}</main>
      {aside}
    </div>
  );
}
