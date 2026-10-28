import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import OverviewContent from "@/components/OverviewContent";
import WorkspaceActions from "@/components/WorkspaceActions";
import { getViewer } from "@/lib/access";
import { loadOverview } from "@/lib/overview";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status: statusFilter } = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const o = await loadOverview(viewer);
  const folder = o.folders.find((f) => f.id === id);
  if (!folder) notFound();
  const rows = o.rows.filter((r) => r.folderId === id);
  if (!viewer.owner && rows.length === 0) notFound();

  return (
    <AppShell activeFolderId={id}>
      <OverviewContent
        title={folder.name}
        subtitle="Visão geral dos sites deste workspace."
        rows={rows}
        lastRun={o.lastRun}
        owner={viewer.owner}
        folders={o.folders}
        defaultFolderId={id}
        statusFilter={statusFilter}
        folderNames={{}}
        basePath={`/workspace/${id}`}
        actions={
          viewer.owner && (
            <WorkspaceActions
              folder={{ id, name: folder.name }}
              siteCount={rows.length}
              candidates={o.rows
                .filter((r) => r.folderId !== id)
                .map((r) => ({ id: r.id, name: r.name, url: r.url, folderName: o.folders.find((fo) => fo.id === r.folderId)?.name ?? null }))}
            />
          )
        }
      />
    </AppShell>
  );
}
