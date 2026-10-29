export default function Loading() {
  return (
    <div className="space-y-4 p-4 sm:p-6" aria-busy="true" aria-label="Carregando">
      <div className="h-7 w-44 animate-pulse rounded-lg bg-bg-white-0" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-bg-white-0" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl bg-bg-white-0" />
    </div>
  );
}
