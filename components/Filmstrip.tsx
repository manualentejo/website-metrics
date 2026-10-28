import { Card, CardHeader } from "@/components/ui/Card";
import InfoTip from "@/components/ui/InfoTip";

export default function Filmstrip({
  finalScreenshot,
  thumbnails,
}: {
  finalScreenshot: string | null;
  thumbnails: { timing: number; data: string }[];
}) {
  if (!finalScreenshot && thumbnails.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="Carregamento quadro a quadro"
        description="Como a página aparece para a pessoa visitante ao longo do tempo."
        info={
          <InfoTip
            title="Filmstrip"
            text="Capturas da tela feitas durante o carregamento. Se os primeiros quadros ficam em branco por muito tempo, a pessoa vê uma tela vazia antes do site aparecer."
          />
        }
      />
      <div className="flex gap-3 overflow-x-auto px-6 pb-6 pt-4">
        {thumbnails.map((t, i) => (
          <figure key={i} className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={t.data}
              alt={`Tela aos ${(t.timing / 1000).toFixed(1)} segundos`}
              className="h-36 rounded-lg border border-stroke-soft-200 object-cover object-top"
            />
            <figcaption className="mt-1 text-center text-paragraph-xs text-text-sub-600">
              {(t.timing / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s
            </figcaption>
          </figure>
        ))}
        {finalScreenshot && (
          <figure className="flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={finalScreenshot}
              alt="Tela final carregada"
              className="h-36 rounded-lg border-2 border-stroke-strong-950 object-cover object-top"
            />
            <figcaption className="mt-1 text-center text-paragraph-xs font-medium text-text-sub-600">Final</figcaption>
          </figure>
        )}
      </div>
    </Card>
  );
}
