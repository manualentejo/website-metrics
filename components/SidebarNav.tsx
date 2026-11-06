"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import RailTip from "./RailTip";
import { RiCalendarLine, RiDashboardLine, RiGlobalLine, RiNotification3Line, RiSparklingLine, RiToolsLine } from "@remixicon/react";

const NAV: { href: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { href: "/", label: "Visão geral", icon: RiDashboardLine },
  { href: "/sites", label: "Sites", icon: RiGlobalLine },
  { href: "/alertas", label: "Alertas", icon: RiNotification3Line },
  { href: "/correcoes", label: "Fila de correções", icon: RiToolsLine },
  { href: "/relatorios", label: "Relatórios", icon: RiCalendarLine },
  { href: "/chat", label: "Numa AI", icon: RiSparklingLine },
];

/** Links globais da barra lateral. O estado ativo vem da URL; recolhida, mostra só o ícone e o nome numa dica ao passar o mouse. */
export default function SidebarNav() {
  const pathname = usePathname();
  return (
    <>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <RailTip key={href} label={label}>
            <Link
              href={href}
              prefetch
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex h-9 items-center gap-2 rounded-lg px-3 text-label-sm transition duration-200 group-data-[collapsed=true]/sb:h-10 group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:px-0 ${
                active ? "bg-[color:var(--accent-soft)] text-text-strong-950" : "text-text-sub-600 hover:bg-[color:var(--accent-soft)] hover:text-text-strong-950"
              }`}
            >
              <Icon className="size-5 flex-shrink-0" />
              <span className="truncate group-data-[collapsed=true]/sb:hidden">{label}</span>
            </Link>
          </RailTip>
        );
      })}
    </>
  );
}
