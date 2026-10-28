import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import OverviewContent from "@/components/OverviewContent";
import { getViewer } from "@/lib/access";
import { loadOverview } from "@/lib/overview";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status: statusFilter } = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const o = await loadOverview(viewer);

  return (
    <AppShell active="home">
      <OverviewContent
        title="Visão geral"
        subtitle="Desempenho, acessibilidade, boas práticas e SEO dos seus sites, medidos pelo Lighthouse."
        rows={o.rows}
        lastRun={o.lastRun}
        owner={viewer.owner}
        folders={o.folders}
        statusFilter={statusFilter}
        folderNames={Object.fromEntries(o.folders.map((f) => [f.id, f.name]))}
      />
    </AppShell>
  );
}
