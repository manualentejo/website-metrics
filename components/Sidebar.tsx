import Link from "next/link";
import type { Status } from "@/lib/types";
import SidebarUserFooter from "./SidebarUserFooter";
import NewFolderForm from "./NewFolderForm";

const STATUS_DOT: Record<Status, string> = {
  no_ar: "bg-emerald-500",
  em_andamento: "bg-amber-500",
};

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "no_ar", label: "No ar" },
  { value: "em_andamento", label: "Em andamento" },
];

interface SiteNavItem {
  id: string;
  name: string;
  status: Status;
  folderId: string | null;
}

export default function Sidebar({
  sites,
  folders,
  activeSiteId,
  statusFilter,
  userEmail,
  isOwner,
}: {
  sites: SiteNavItem[];
  folders: { id: string; name: string }[];
  activeSiteId?: string;
  statusFilter?: string;
  userEmail?: string;
  isOwner?: boolean;
}) {
  const filtered = statusFilter ? sites.filter((s) => s.status === statusFilter) : sites;

  const grouped: { id: string | null; name: string; sites: SiteNavItem[] }[] = [
    ...folders.map((f) => ({ id: f.id, name: f.name, sites: filtered.filter((s) => s.folderId === f.id) })),
    { id: null, name: "Sem pasta", sites: filtered.filter((s) => s.folderId === null) },
  ].filter((g) => g.sites.length > 0 || (g.id === null && folders.length === 0));

  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-surface-border bg-surface-sidebar">
      <div className="px-5 py-6">
        <Link href="/" className="block">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">MINO</p>
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
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <nav className="mt-4 flex-1 space-y-4 overflow-y-auto px-2 pb-4">
        {grouped.map((group) => (
          <div key={group.id ?? "none"}>
            {folders.length > 0 && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {group.name}
              </p>
            )}
            {group.sites.map((site) => (
              <Link
                key={site.id}
                href={`/site/${site.id}`}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  site.id === activeSiteId
                    ? "bg-slate-100 text-slate-900 font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[site.status]}`} />
                <span className="truncate">{site.name}</span>
              </Link>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-2 text-sm text-slate-400">Nenhum site nesse filtro.</p>
        )}
        {isOwner && (
          <div className="px-1">
            <NewFolderForm />
          </div>
        )}
      </nav>

      {userEmail && <SidebarUserFooter email={userEmail} />}
    </aside>
  );
}
