import SiteWorkspace from "@/components/site/SiteWorkspace";
import { Card, CardHeader } from "@/components/ui/Card";
import ChartEmptyState from "@/components/charts/ChartEmptyState";

export const dynamic = "force-dynamic";

export default async function SiteCompetitorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <SiteWorkspace siteId={id} tab="competitors">
      <Card>
        <CardHeader title="Concorrentes" description="Compare este site com outros domínios nas mesmas métricas." />
        <div className="p-5">
          <ChartEmptyState kind="setup" title="Nenhum concorrente cadastrado" className="h-56">
            Esta área ainda não tem coleta de dados. Nenhuma comparação é exibida enquanto não houver medições reais dos concorrentes.
          </ChartEmptyState>
        </div>
      </Card>
    </SiteWorkspace>
  );
}
