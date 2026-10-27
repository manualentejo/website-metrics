import { getServerSession } from "next-auth";
import { authOptions, isOwner } from "@/lib/auth";
import { db } from "@/db/client";
import { siteAccess } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface Viewer {
  email: string;
  owner: boolean;
}

export async function getViewer(): Promise<Viewer | null> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  return { email, owner: isOwner(email) };
}

/** E-mails com acesso a sites "shared", indexado por site_id. */
export async function getAccessibleSiteIds(email: string): Promise<Set<string>> {
  const rows = await db.select().from(siteAccess).where(eq(siteAccess.email, email.toLowerCase()));
  return new Set(rows.map((r) => r.siteId));
}

export function canViewSite(
  viewer: Viewer,
  site: { visibility: string },
  accessibleSiteIds: Set<string>,
  siteId: string
): boolean {
  if (viewer.owner) return true;
  return site.visibility === "shared" && accessibleSiteIds.has(siteId);
}
