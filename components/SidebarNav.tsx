"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { RiCalendarLine, RiDashboardLine, RiGlobalLine, RiNotification3Line, RiScalesLine, RiToolsLine } from "@remixicon/react";

const NAV: { href: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { href: "/", label: "Visão geral", icon: RiDashboardLine },
  { href: "/sites", label: "Sites", icon: RiGlobalLine },
  { href: "/alertas", label: "Alertas", icon: RiNotification3Line },
  { href: "/comparativo", label: "Comparativo", icon: RiScalesLine },
  { href: "/correcoes", label: "Fila de correções", icon: RiToolsLine },
  { href: "/relatorios", label: "Relatórios", icon: RiCalendarLine },
];

/** Links globais da barra lateral. O estado ativo vem da URL, então a barra nunca precisa ser recriada ao navegar. */
export default function SidebarNav() {
  const pathname = usePathname();
  return (
    <>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            prefetch
            aria-current={active ? "page" : undefined}
            className={`flex h-9 items-center gap-2 rounded-lg px-3 text-label-sm transition duration-200 ${
              active ? "bg-bg-weak-50 text-text-strong-950" : "text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950"
            }`}
          >
            <Icon className="size-5 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </>
  );
}
