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
  `flex items-center gap-2.5 rounded-md px-2.5 h-8 text-[13px] transition-colors ${
    active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
  }`;

function SiteLink({ site, active }: { site: Item; active: boolean }) {
  return (
    <Link href={`/site/${site.id}`} className={row(active)}>
      <RiGlobalLine className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 truncate">{site.name}</span>
      <span
        className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${site.status === "no_ar" ? "bg-success" : "bg-warning"}`}
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
      <div className={`flex items-center rounded-md ${row(group.id === activeFolderId)} !p-0 !h-8`}>
        <Link href={`/workspace/${group.id}`} className="flex h-8 flex-1 items-center gap-2.5 truncate px-2.5">
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{group.name}</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`${open ? "Recolher" : "Expandir"} ${group.name}`}
          className="mr-1 rounded-md p-1.5 hover:bg-accent"
        >
          <RiArrowDownSLine className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
      </div>
      {open && (
        <div className="ml-[19px] mt-0.5 space-y-0.5 border-l border-border pl-2">
          {group.sites.map((s) => (
            <SiteLink key={s.id} site={s} active={s.id === activeSiteId} />
          ))}
          {group.sites.length === 0 && <p className="px-2.5 py-1 text-xs text-muted-foreground">Nenhum site</p>}
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
        <p className="px-2.5 pb-1 pt-3 text-[11px] font-medium text-muted-foreground">Sem workspace</p>
      )}
      {loose.map((s) => (
        <SiteLink key={s.id} site={s} active={s.id === activeSiteId} />
      ))}
    </div>
  );
}
