import Link from "next/link";
import type { Status } from "@/lib/types";

const STATUS_DOT: Record<Status, string> = {
  no_ar: "bg-emerald-500",
  em_andamento: "bg-amber-500",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "no_ar", label: "No ar" },
  { value: "em_andamento", label: "Em andamento" },
];

export default function Sidebar({
  sites,
  activeSiteId,
  statusFilter,
}: {
  sites: { id: string; name: string; status: Status }[];
  activeSiteId?: string;
  statusFilter?: string;
}) {
  const filtered = statusFilter ? sites.filter((s) => s.status === statusFilter) : sites;

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-surface-border bg-surface-sidebar">
      <div className="px-5 py-6">
        <Link href="/" className="block">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">MINO</p>
          <h1 className="mt-0.5 text-base font-semibold text-slate-900">Métricas de Sites</h1>
        </Link>
      </div>

      <div className="flex gap-1 px-4">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/?status=${f.value}` : "/"}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              (statusFilter ?? "") === f.value
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto px-2 pb-6">
        {filtered.map((site) => (
          <Link
            key={site.id}
            href={`/site/${site.id}`}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              site.id === activeSiteId
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[site.status]}`} />
            <span className="truncate">{site.name}</span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-2 text-sm text-slate-400">Nenhum site nesse filtro.</p>
        )}
      </nav>
    </aside>
  );
}
