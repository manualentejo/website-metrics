import { notFound, redirect } from "next/navigation";
import AddSiteBar from "@/components/AddSiteBar";
import WebsiteInventory from "@/components/overview/WebsiteInventory";
import ShareWorkspaceButton from "@/components/ShareWorkspaceButton";
import WorkspaceActions from "@/components/WorkspaceActions";
import { Page } from "@/components/ui/Page";
import { getViewer } from "@/lib/access";
import { loadInventory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

// Um workspace: mesma lista e comparação da página Sites, só com os sites do grupo.
export default async function WorkspacePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ d?: string }> }) {
  const { id } = await params;
  const { d } = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { rows: all, folders } = await loadInventory(viewer);
  const folder = folders.find((f) => f.id === id);
  if (!folder) notFound();
  const rows = all.filter((r) => r.folderId === id);
  if (!viewer.owner && rows.length === 0) notFound();

  return (
    <Page
      title={folder.name}
      subtitle="Sites deste workspace. Compare as notas por dispositivo."
      actions={
        viewer.owner && (
          <div className="flex flex-wrap items-center gap-2">
            <ShareWorkspaceButton folder={{ id, name: folder.name }} />
            <WorkspaceActions
              folder={{ id, name: folder.name }}
              siteCount={rows.length}
              candidates={all.filter((r) => r.folderId !== id).map((r) => ({ id: r.id, name: r.name, url: r.url, folderName: r.folder }))}
            />
          </div>
        )
      }
    >
      {viewer.owner && <AddSiteBar folders={folders} defaultFolderId={id} />}
      <WebsiteInventory rows={rows} owner={viewer.owner} initialDevice={d === "mobile" ? "mobile" : "desktop"} showWorkspace={false} />
    </Page>
  );
}
