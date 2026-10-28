"use client";
import { RiArrowDownSLine, RiFolderLine, RiFolderOpenLine, RiGlobalLine } from "@remixicon/react";

import { useState } from "react";
import Link from "next/link";


interface Item {
  id: string;
  name: string;
  status: "no_ar" | "em_andamento";
}

export interface TreeGroup {
  id: string;
  name: string;
  sites: Item[];
}

const row = (active: boolean) =>
  `flex items-center gap-2 rounded-lg px-3 h-9 text-label-sm transition duration-200 ${
    active ? "bg-bg-weak-50 text-text-strong-950" : "text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950"
  }`;

function SiteLink({ site, active }: { site: Item; active: boolean }) {
  return (
    <Link href={`/site/${site.id}`} className={row(active)}>
      <RiGlobalLine className="size-5 flex-shrink-0" />
      <span className="flex-1 truncate">{site.name}</span>
      <span
        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${site.status === "no_ar" ? "bg-success-base-base" : "bg-warning-base-base"}`}
        title={site.status === "no_ar" ? "No ar" : "Em andamento"}
      />
    </Link>
  );
}

function Group({ group, activeSiteId, activeFolderId }: { group: TreeGroup; activeSiteId?: string; activeFolderId?: string }) {
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
          {group.sites.map((s) => (
            <SiteLink key={s.id} site={s} active={s.id === activeSiteId} />
          ))}
          {group.sites.length === 0 && <p className="px-3 py-1 text-paragraph-xs text-text-sub-600">Nenhum site</p>}
        </div>
      )}
    </div>
  );
}

export default function WorkspaceTree({
  groups,
  loose,
  activeSiteId,
  activeFolderId,
}: {
  groups: TreeGroup[];
  loose: Item[];
  activeSiteId?: string;
  activeFolderId?: string;
}) {
  return (
    <div className="space-y-0.5">
      {groups.map((g) => (
        <Group key={g.id} group={g} activeSiteId={activeSiteId} activeFolderId={activeFolderId} />
      ))}
      {loose.length > 0 && groups.length > 0 && (
        <p className="px-2.5 pb-1 pt-3 text-paragraph-xs font-medium text-text-sub-600">Sem workspace</p>
      )}
      {loose.map((s) => (
        <SiteLink key={s.id} site={s} active={s.id === activeSiteId} />
      ))}
    </div>
  );
}
