import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import AddSiteBar from "@/components/AddSiteBar";
import { SitesTable } from "@/components/OverviewContent";
import { Page } from "@/components/ui/Page";
import { getViewer } from "@/lib/access";
import { loadOverview } from "@/lib/overview";

export const dynamic = "force-dynamic";

export default async function SitesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const o = await loadOverview(viewer);

  return (
    <AppShell active="sites">
      <Page title="Sites" subtitle="Todos os sites que você monitora, em qualquer workspace.">
        {viewer.owner && <AddSiteBar folders={o.folders} />}
        <SitesTable
          title="Todos os sites"
          rows={o.rows}
          owner={viewer.owner}
          folderNames={Object.fromEntries(o.folders.map((f) => [f.id, f.name]))}
          basePath="/sites"
          statusFilter={status}
        />
      </Page>
    </AppShell>
  );
}
