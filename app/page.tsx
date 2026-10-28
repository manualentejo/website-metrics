import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import OverviewContent from "@/components/OverviewContent";
import { getViewer } from "@/lib/access";
import { loadOverview } from "@/lib/overview";
import type { Status } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusFilter } = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const o = await loadOverview(viewer);

  return (
    <div className="flex">
      <Sidebar
        sites={o.visible.map((s) => ({ id: s.id, name: s.name, status: s.status as Status, folderId: s.folderId }))}
        folders={o.folders}
        statusFilter={statusFilter}
        userEmail={viewer.email}
        isOwner={viewer.owner}
      />
      <main className="h-screen flex-1 overflow-y-auto">
        <OverviewContent
          title="Visão geral"
          subtitle="Lighthouse via PageSpeed Insights, atualizado toda sexta-feira às 15h (horário de Brasília)."
          rows={o.rows}
          lastRun={o.lastRun}
          owner={viewer.owner}
          folders={o.folders}
          statusFilter={statusFilter}
          folderNames={Object.fromEntries(o.folders.map((f) => [f.id, f.name]))}
        />
      </main>
    </div>
  );
}
