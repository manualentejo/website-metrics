import { redirect } from "next/navigation";
import AddSiteBar from "@/components/AddSiteBar";
import WebsiteInventory from "@/components/overview/WebsiteInventory";
import { Page } from "@/components/ui/Page";
import { getViewer } from "@/lib/access";
import { loadInventory } from "@/lib/inventory";
import { getDevice } from "@/lib/device";

export const dynamic = "force-dynamic";

// Lista e comparação de todos os sites: cadastrar, achar, configurar e comparar notas por dispositivo.
export default async function SitesPage() {
  const device = await getDevice();
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { rows, folders } = await loadInventory(viewer);

  return (
    <Page title="Sites" subtitle="Adicione, compare e configure os sites monitorados. Abra um site para ver desempenho, SEO e GEO.">
      {viewer.owner && <AddSiteBar folders={folders} />}
      <WebsiteInventory rows={rows} owner={viewer.owner} initialDevice={device} />
    </Page>
  );
}
