import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { sites, folders } from "@/db/schema";
import SidebarFrame from "./SidebarFrame";
import { SiteIconsProvider } from "./SiteIcon";
import IconBackfill from "./IconBackfill";
import { getIconMap, hostKey } from "@/lib/siteIcons";
import Sidebar from "./Sidebar";
import { getViewer, getAccessibleSiteIds, canViewSite } from "@/lib/access";
import { getProfile } from "@/lib/profile";
import type { Status } from "@/lib/types";

// Moldura única (layout do grupo app): a barra lateral fica montada e só o conteúdo à direita troca ao navegar.
export default async function AppFrame({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const accessible = viewer.owner ? new Set<string>() : await getAccessibleSiteIds(viewer.email);
  const [allSites, allFolders, profile, icons] = await Promise.all([
    db.select().from(sites).orderBy(asc(sites.sortOrder), asc(sites.createdAt)),
    db.select().from(folders).orderBy(asc(folders.sortOrder), asc(folders.createdAt)),
    getProfile(viewer.email),
    getIconMap().catch(() => ({}) as Record<string, string>),
  ]);
  const visible = allSites.filter((s) => canViewSite(viewer, s, accessible, s.id));

  const missingIcons = viewer.owner && visible.some((s) => !icons[hostKey(s.url)]);

  return (
    <SiteIconsProvider icons={icons}>
    <SidebarFrame
      sidebar={
      <Sidebar
        sites={visible.map((s) => ({ id: s.id, name: s.name, url: s.url, status: s.status as Status, folderId: s.folderId }))}
        folders={allFolders}
        isOwner={viewer.owner}
        user={{
          email: viewer.email,
          name: profile.name ?? viewer.name ?? viewer.email.split("@")[0],
          image: profile.image ?? viewer.image ?? null,
        }}
      />
      }
    >
      <main className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-weak-50 lg:my-2 lg:mr-2 lg:rounded-2xl">{children}</main>
    </SidebarFrame>
    {missingIcons && <IconBackfill />}
    </SiteIconsProvider>
  );
}
