import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { folders, siteAccess } from "@/db/schema";
import SiteWorkspace, { requireSite } from "@/components/site/SiteWorkspace";
import SiteSettingsDialog from "@/components/SiteSettingsDialog";
import SharingPanel from "@/components/SharingPanel";
import { Card, CardHeader } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ config?: string }> }) {
  const { id } = await params;
  const { config } = await searchParams;
  const { viewer, site } = await requireSite(id);
  if (!viewer.owner) redirect(`/site/${id}`);

  const [allFolders, access] = await Promise.all([
    db.select().from(folders).orderBy(asc(folders.sortOrder)),
    db.select().from(siteAccess).where(eq(siteAccess.siteId, id)),
  ]);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const snippet = `<script defer src="https://${host}/t.js" data-site="${id}"></script>`;

  return (
    <SiteWorkspace siteId={id} tab="settings">
      <Card>
        <CardHeader title="Dados do site" description="Nome, endereço, workspace, contagem de visitas e exclusão." />
        <div className="p-5">
          <SiteSettingsDialog
            site={{ id: site.id, name: site.name, url: site.url, folderId: site.folderId }}
            folders={allFolders.map((f) => ({ id: f.id, name: f.name }))}
            snippet={snippet}
            defaultOpen={config === "1"}
          />
        </div>
      </Card>
      <SharingPanel
        siteId={site.id}
        visibility={site.visibility as "private" | "shared"}
        initialEmails={access.map((r) => r.email)}
        folders={allFolders}
        currentFolderId={site.folderId}
      />
    </SiteWorkspace>
  );
}
