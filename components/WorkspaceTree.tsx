"use client";
import { RiArrowDownSLine, RiDraggable, RiFolderLine, RiFolderOpenLine } from "@remixicon/react";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SiteIcon from "./SiteIcon";

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
    active ? "bg-bg-soft-200 text-text-strong-950" : "text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950"
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

export default function WorkspaceTree({ groups, loose, canReorder = false }: { groups: TreeGroup[]; loose: Item[]; canReorder?: boolean }) {
  const pathname = usePathname();
  const activeSiteId = pathname.split("/")[1] === "site" ? pathname.split("/")[2] : undefined;
  const activeFolderId = pathname.split("/")[1] === "workspace" ? pathname.split("/")[2] : undefined;
  return (
    <div className="space-y-0.5">
      {groups.map((g) => (
        <Group key={g.id} group={g} activeSiteId={activeSiteId} activeFolderId={activeFolderId} canReorder={canReorder} />
      ))}
      {loose.length > 0 && groups.length > 0 && (
        <p className="px-2.5 pb-1 pt-3 text-paragraph-xs font-medium text-text-sub-600">Sem workspace</p>
      )}
      <SiteList sites={loose} activeSiteId={activeSiteId} canReorder={canReorder} />
    </div>
  );
}
