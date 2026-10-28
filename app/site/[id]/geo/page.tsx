import SiteWorkspace from "@/components/site/SiteWorkspace";
import { Card, CardHeader } from "@/components/ui/Card";
import ChartEmptyState from "@/components/charts/ChartEmptyState";

export const dynamic = "force-dynamic";

// GEO: preparo para mecanismos de IA. Ainda não há coleta; a página só declara o contrato e não simula números.
export default async function SiteGeoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <SiteWorkspace siteId={id} tab="geo">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="AI Visibility" description="Menções e citações em prompts que você monitora." />
          <div className="p-5">
            <ChartEmptyState kind="setup" title="Nenhum prompt monitorado" className="h-60">
              Cadastre prompts e mecanismos de IA para acompanhar menções, citações verificadas e a variação por período. Mede só os prompts cadastrados, não toda a
              atividade das plataformas.
            </ChartEmptyState>
          </div>
        </Card>
        <Card>
          <CardHeader title="GEO Technical Score" description="Preparo técnico do site para ser lido por IAs (rastreadores, dados estruturados, clareza do conteúdo)." />
          <div className="p-5">
            <ChartEmptyState kind="setup" title="Auditoria GEO ainda não existe" className="h-60">
              É uma medida técnica, diferente de AI Visibility. As verificações de SEO do Lighthouse na aba SEO continuam valendo como base.
            </ChartEmptyState>
          </div>
        </Card>
      </div>
    </SiteWorkspace>
  );
}
