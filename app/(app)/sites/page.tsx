import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import AddSiteBar from "@/components/AddSiteBar";
import WebsiteInventory from "@/components/overview/WebsiteInventory";
import { Page } from "@/components/ui/Page";
import { getViewer } from "@/lib/access";
import { loadOverview } from "@/lib/overview";

export const dynamic = "force-dynamic";

// Inventário: cadastrar, achar, configurar e abrir sites. A análise de portfólio fica na Visão geral.
export default async function SitesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const o = await loadOverview(viewer);
  const folderName = new Map(o.folders.map((f) => [f.id, f.name]));

  return (
    <AppShell active="sites">
      <Page title="Sites" subtitle="Adicione, encontre e configure os sites monitorados. Abra um site para ver SEO, desempenho e visitas.">
        {viewer.owner && <AddSiteBar folders={o.folders} />}
        <WebsiteInventory
          owner={viewer.owner}
          rows={o.rows.map((r) => ({
            id: r.id,
            name: r.name,
            url: r.url,
            status: r.status as "no_ar" | "em_andamento",
            folder: r.folderId ? (folderName.get(r.folderId) ?? null) : null,
            seo: r.desktop?.seoScore ?? null,
            performance: r.desktop?.performanceScore ?? null,
            lastAudit: r.desktop?.ranAt ? new Date(r.desktop.ranAt).toISOString() : null,
            createdAt: new Date(r.createdAt).toISOString(),
          }))}
        />
      </Page>
    </AppShell>
  );
}
