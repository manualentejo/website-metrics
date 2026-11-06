"use client";
import { RiArrowDownSLine, RiDraggable, RiFolderLine, RiFolderOpenLine } from "@remixicon/react";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SiteIcon from "./SiteIcon";
import RailTip from "./RailTip";

interface Item {
  id: string;
  name: string;
  url: string;
  status: "no_ar" | "em_andamento";
}

export interface TreeGroup {
  id: string;
  name: string;
  sites: Item[];
}

const row = (active: boolean) =>
  `flex items-center gap-2 rounded-lg px-3 h-9 text-label-sm transition duration-200 ${
    active ? "bg-[color:var(--accent-soft)] text-text-strong-950" : "text-text-sub-600 hover:bg-bg-soft-200 hover:text-text-strong-950"
  }`;

/**
 * Lista de sites que o dono pode reordenar: arrastando a linha, ou com Alt + ↑/↓ no teclado.
 * A ordem aparece na hora e é salva em seguida.
 */
function SiteList({ sites, activeSiteId, canReorder }: { sites: Item[]; activeSiteId?: string; canReorder: boolean }) {
  const router = useRouter();
  const [order, setOrder] = useState(sites.map((s) => s.id));
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const key = sites.map((s) => s.id).join(",");
  const orderRef = useRef(order);
  orderRef.current = order;

  useEffect(() => setOrder(sites.map((s) => s.id)), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const byId = new Map(sites.map((s) => [s.id, s]));
  const ordered = order.map((id) => byId.get(id)).filter((s): s is Item => !!s);

  async function save(next: string[]) {
    setOrder(next);
    await fetch("/api/sites/order", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: next }) }).catch(() => {});
    router.refresh();
  }

  function move(id: string, to: number) {
    const cur = orderRef.current;
    const from = cur.indexOf(id);
    if (from < 0 || to < 0 || to >= cur.length || from === to) return;
    const next = [...cur];
    next.splice(to, 0, next.splice(from, 1)[0]);
    void save(next);
  }

  return (
    <>
      {ordered.map((s, i) => {
        const active = s.id === activeSiteId;
        return (
          <div
            key={s.id}
            draggable={canReorder}
            onDragStart={(e) => {
              setDragging(s.id);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", s.id);
            }}
            onDragOver={(e) => {
              if (!dragging) return;
              e.preventDefault();
              setOver(s.id);
            }}
            onDragLeave={() => setOver((o) => (o === s.id ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging && dragging !== s.id) move(dragging, orderRef.current.indexOf(s.id));
              setDragging(null);
              setOver(null);
            }}
            onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}
            className={`group/row relative rounded-lg ${dragging === s.id ? "opacity-40" : ""} ${over === s.id && dragging !== s.id ? "ring-2 ring-stroke-strong-950" : ""}`}
          >
            <Link
              href={`/site/${s.id}`}
              draggable={false}
              onKeyDown={(e) => {
                if (canReorder && e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
                  e.preventDefault();
                  move(s.id, i + (e.key === "ArrowUp" ? -1 : 1));
                }
              }}
              aria-description={canReorder ? "Alt + seta para cima ou para baixo reordena" : undefined}
              className={row(active)}
            >
              <SiteIcon url={s.url} name={s.name} size={20} />
              <span className="flex-1 truncate">{s.name}</span>
              {canReorder && <RiDraggable className="size-4 flex-shrink-0 cursor-grab text-text-soft-400 opacity-0 transition group-hover/row:opacity-100" aria-hidden />}
              <span
                className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${s.status === "no_ar" ? "bg-success-base" : "bg-warning-base"}`}
                title={s.status === "no_ar" ? "No ar" : "Em andamento"}
              />
            </Link>
          </div>
        );
      })}
    </>
  );
}

function Group({ group, activeSiteId, activeFolderId, canReorder }: { group: TreeGroup; activeSiteId?: string; activeFolderId?: string; canReorder: boolean }) {
  const containsActive = group.id === activeFolderId || group.sites.some((s) => s.id === activeSiteId);
  const [open, setOpen] = useState(containsActive);
  const Icon = open ? RiFolderOpenLine : RiFolderLine;

  return (
    <div>
      <div className={`flex items-center ${row(group.id === activeFolderId)} !p-0 !h-9`}>
        <Link href={`/workspace/${group.id}`} className="flex h-9 flex-1 items-center gap-2 truncate px-3">
          <Icon className="size-5 flex-shrink-0" />
          <span className="truncate">{group.name}</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`${open ? "Recolher" : "Expandir"} ${group.name}`}
          className="mr-1 rounded-md p-1 hover:bg-bg-soft-200"
        >
          <RiArrowDownSLine className={`size-4 transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
      </div>
      {open && (
        <div className="ml-[19px] mt-0.5 space-y-0.5 border-l border-stroke-soft-200 pl-2">
          <SiteList sites={group.sites} activeSiteId={activeSiteId} canReorder={canReorder} />
          {group.sites.length === 0 && <p className="px-3 py-1 text-paragraph-xs text-text-sub-600">Nenhum site</p>}
        </div>
      )}
    </div>
  );
}


/**
 * Workspace na barra recolhida: ícone de pasta com um triângulo no canto inferior direito (sinal de que há mais opções).
 * Clique abre o workspace; botão direito (ou a tecla de menu / Shift+F10) abre a lista rápida dos sites dele.
 */
function RailWorkspace({ group, activeFolderId, activeSiteId }: { group: TreeGroup; activeFolderId?: string; activeSiteId?: string }) {
  const [menu, setMenu] = useState<{ top: number; left: number } | null>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const active = group.id === activeFolderId || group.sites.some((s) => s.id === activeSiteId);

  useEffect(() => setMenu(null), [pathname]);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        linkRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    const onScroll = (e: Event) => {
      if (!menuRef.current?.contains(e.target as Node)) close(); // rolar a própria lista não fecha o menu
    };
    window.addEventListener("scroll", onScroll, true);
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [menu]);

  function open(e: React.MouseEvent) {
    e.preventDefault();
    const r = linkRef.current?.getBoundingClientRect();
    if (r) setMenu({ top: Math.max(8, Math.min(r.top, window.innerHeight - 340)), left: r.right + 10 });
  }

  const item = "flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-label-sm text-text-strong-950 hover:bg-bg-soft-200 focus-visible:bg-bg-soft-200 focus-visible:outline-none";

  return (
    <>
      <RailTip label={group.name}>
        <Link
          ref={linkRef}
          href={`/workspace/${group.id}`}
          onContextMenu={open}
          aria-label={`Workspace ${group.name}. Botão direito para ver os sites.`}
          aria-haspopup="menu"
          aria-expanded={!!menu}
          className={`relative flex h-10 items-center justify-center rounded-lg transition duration-200 ${active ? "bg-[color:var(--accent-soft)] text-text-strong-950" : "text-text-sub-600 hover:bg-bg-soft-200 hover:text-text-strong-950"}`}
        >
          <RiFolderLine className="size-5" />
          <span aria-hidden className="absolute bottom-1 right-1 h-0 w-0 border-b-[6px] border-l-[6px] border-solid border-b-text-soft-400 border-l-transparent" />
        </Link>
      </RailTip>
      {menu &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Opções de ${group.name}`}
            style={{ position: "fixed", top: menu.top, left: menu.left }}
            className="glass-strong z-[70] max-h-80 w-64 overflow-y-auto rounded-2xl p-2"
          >
            <p className="truncate px-2.5 pb-1 pt-1.5 text-label-xs uppercase tracking-wide text-text-soft-400">{group.name}</p>
            <Link href={`/workspace/${group.id}`} role="menuitem" className={item}>
              <RiFolderOpenLine className="size-4 flex-shrink-0 text-text-sub-600" />
              Abrir workspace
            </Link>
            <div className="my-1 border-t border-stroke-soft-200" />
            {group.sites.length === 0 && <p className="px-2.5 py-2 text-paragraph-xs text-text-sub-600">Nenhum site neste workspace.</p>}
            {group.sites.map((s) => (
              <Link key={s.id} href={`/site/${s.id}`} role="menuitem" className={`${item} ${s.id === activeSiteId ? "bg-[color:var(--accent-soft)]" : ""}`}>
                <SiteIcon url={s.url} name={s.name} size={18} />
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                <span className={`size-1.5 flex-shrink-0 rounded-full ${s.status === "no_ar" ? "bg-success-base" : "bg-warning-base"}`} aria-hidden />
              </Link>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

export default function WorkspaceTree({ groups, loose, canReorder = false }: { groups: TreeGroup[]; loose: Item[]; canReorder?: boolean }) {
  const pathname = usePathname();
  const activeSiteId = pathname.split("/")[1] === "site" ? pathname.split("/")[2] : undefined;
  const activeFolderId = pathname.split("/")[1] === "workspace" ? pathname.split("/")[2] : undefined;
  return (
    <>
      {/* Barra recolhida: cada workspace e cada site solto vira só um ícone (o nome aparece numa dica). */}
      <div className="hidden flex-col items-stretch gap-0.5 group-data-[collapsed=true]/sb:flex">
        {groups.map((g) => (
          <RailWorkspace key={g.id} group={g} activeFolderId={activeFolderId} activeSiteId={activeSiteId} />
        ))}
        {loose.map((s) => (
          <RailTip key={s.id} label={s.name}>
            <Link
              href={`/site/${s.id}`}
              aria-label={s.name}
              className={`flex h-10 items-center justify-center rounded-lg transition duration-200 ${s.id === activeSiteId ? "bg-[color:var(--accent-soft)]" : "hover:bg-bg-soft-200"}`}
            >
              <SiteIcon url={s.url} name={s.name} size={22} />
            </Link>
          </RailTip>
        ))}
      </div>
    <div className="space-y-0.5 group-data-[collapsed=true]/sb:hidden">
      {groups.map((g) => (
        <Group key={g.id} group={g} activeSiteId={activeSiteId} activeFolderId={activeFolderId} canReorder={canReorder} />
      ))}
      {loose.length > 0 && groups.length > 0 && (
        <p className="px-2.5 pb-1 pt-3 text-paragraph-xs font-medium text-text-sub-600">Sem workspace</p>
      )}
      <SiteList sites={loose} activeSiteId={activeSiteId} canReorder={canReorder} />
    </div>
    </>
  );
}
