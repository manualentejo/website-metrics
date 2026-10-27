export default function Filmstrip({
  finalScreenshot,
  thumbnails,
}: {
  finalScreenshot: string | null;
  thumbnails: { timing: number; data: string }[];
}) {
  if (!finalScreenshot && thumbnails.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">Navegação da página (última análise)</h3>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {finalScreenshot && (
          <div className="flex-shrink-0">
            <img
              src={finalScreenshot}
              alt="Captura final da página"
              className="h-40 rounded-lg border border-surface-border object-cover object-top"
            />
            <p className="mt-1 text-center text-xs text-slate-400">Final</p>
          </div>
        )}
        {thumbnails.map((t, i) => (
          <div key={i} className="flex-shrink-0">
            <img
              src={t.data}
              alt={`Captura em ${t.timing}ms`}
              className="h-40 rounded-lg border border-surface-border object-cover object-top"
            />
            <p className="mt-1 text-center text-xs text-slate-400">{(t.timing / 1000).toFixed(1)}s</p>
          </div>
        ))}
      </div>
    </div>
  );
}
