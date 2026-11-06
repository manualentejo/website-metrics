import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions, isOwner } from "@/lib/auth";
import { db } from "@/db/client";
import { sites, siteAccess } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { siteIdsViaFolders } from "@/lib/folderAccess";

export interface Viewer {
  email: string;
  owner: boolean;
  name?: string | null;
  image?: string | null;
}

// cache(): numa mesma requisição, layout e página compartilham o mesmo resultado (uma só leitura da sessão).
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  return { email, owner: isOwner(email), name: session?.user?.name, image: session?.user?.image };
});

/**
 * Sites que este e-mail pode ver (fora o dono): os compartilhados um a um (só se o site estiver como
 * "shared") e todos os sites dos workspaces compartilhados com ele.
 */
export async function getAccessibleSiteIds(email: string): Promise<Set<string>> {
  const direct = await db
    .select({ id: siteAccess.siteId })
    .from(siteAccess)
    .innerJoin(sites, eq(sites.id, siteAccess.siteId))
    .where(and(eq(siteAccess.email, email.toLowerCase()), eq(sites.visibility, "shared")));
  const viaFolders = await siteIdsViaFolders(email).catch(() => [] as string[]);
  return new Set([...direct.map((r) => r.id), ...viaFolders]);
}

export function canViewSite(
  viewer: Viewer,
  _site: { visibility: string },
  accessibleSiteIds: Set<string>,
  siteId: string
): boolean {
  if (viewer.owner) return true;
  return accessibleSiteIds.has(siteId);
}
