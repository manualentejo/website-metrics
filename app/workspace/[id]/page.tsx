import { notFound, redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import OverviewContent from "@/components/OverviewContent";
import { getViewer } from "@/lib/access";
import { loadOverview } from "@/lib/overview";
import type { Status } from "@/lib/types";

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
    <div className="flex">
      <Sidebar
        sites={o.visible.map((s) => ({ id: s.id, name: s.name, status: s.status as Status, folderId: s.folderId }))}
        folders={o.folders}
        activeFolderId={id}
        userEmail={viewer.email}
        isOwner={viewer.owner}
      />
      <main className="h-screen flex-1 overflow-y-auto">
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
        />
      </main>
    </div>
  );
}
