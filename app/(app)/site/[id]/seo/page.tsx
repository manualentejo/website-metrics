import SiteWorkspace from "@/components/site/SiteWorkspace";
import AnalysisTab from "@/components/site/AnalysisTab";
import { requireSite } from "@/components/site/SiteWorkspace";

export const dynamic = "force-dynamic";

export default async function SiteSeoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ strategy?: string; from?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const { site } = await requireSite(id);
  return (
    <SiteWorkspace siteId={id} tab="seo">
      <AnalysisTab
        siteId={id}
        siteName={site.name}
        basePath={`/site/${id}/seo`}
        strategy={sp.strategy === "mobile" ? "mobile" : "desktop"}
        categories={["seo"]}
        showHistory={false}
        highlight={sp.from === "overview" ? "Visão geral" : undefined}
      />
    </SiteWorkspace>
  );
}
