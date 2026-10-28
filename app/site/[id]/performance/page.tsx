import SiteWorkspace, { requireSite } from "@/components/site/SiteWorkspace";
import AnalysisTab from "@/components/site/AnalysisTab";

export const dynamic = "force-dynamic";

export default async function SitePerformancePage({
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
    <SiteWorkspace siteId={id} tab="performance">
      <AnalysisTab
        siteId={id}
        siteName={site.name}
        basePath={`/site/${id}/performance`}
        strategy={sp.strategy === "mobile" ? "mobile" : "desktop"}
        categories={["performance", "accessibility", "best-practices"]}
        showHistory
        highlight={sp.from === "overview" ? "Visão geral" : undefined}
      />
    </SiteWorkspace>
  );
}
