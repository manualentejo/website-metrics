"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { RiCalendarLine, RiDashboardLine, RiGlobalLine, RiNotification3Line, RiSparklingLine, RiToolsLine } from "@remixicon/react";

const NAV: { href: string; label: string; short: string; icon: ComponentType<{ className?: string }> }[] = [
  { href: "/", label: "Visão geral", short: "Início", icon: RiDashboardLine },
  { href: "/sites", label: "Sites", short: "Sites", icon: RiGlobalLine },
  { href: "/alertas", label: "Alertas", short: "Alertas", icon: RiNotification3Line },
  { href: "/correcoes", label: "Fila de correções", short: "Correções", icon: RiToolsLine },
  { href: "/relatorios", label: "Relatórios", short: "Relat.", icon: RiCalendarLine },
  { href: "/chat", label: "Chat com a Numa", short: "Numa", icon: RiSparklingLine },
];

/** Links globais da barra lateral. O estado ativo vem da URL; recolhida, mostra ícone com um rótulo curto embaixo. */
export default function SidebarNav() {
  const pathname = usePathname();
  return (
    <>
      {NAV.map(({ href, label, short, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            prefetch
            title={label}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`flex h-9 items-center gap-2 rounded-lg px-3 text-label-sm transition duration-200 group-data-[collapsed=true]/sb:h-14 group-data-[collapsed=true]/sb:flex-col group-data-[collapsed=true]/sb:justify-center group-data-[collapsed=true]/sb:gap-0.5 group-data-[collapsed=true]/sb:px-1 ${
              active ? "bg-bg-sub-300 text-text-strong-950" : "text-text-sub-600 hover:bg-bg-soft-200 hover:text-text-strong-950"
            }`}
          >
            <Icon className="size-5 flex-shrink-0" />
            <span className="truncate group-data-[collapsed=true]/sb:hidden">{label}</span>
            <span className="hidden max-w-full truncate text-[10px] leading-tight group-data-[collapsed=true]/sb:block" aria-hidden>
              {short}
            </span>
          </Link>
        );
      })}
    </>
  );
}
