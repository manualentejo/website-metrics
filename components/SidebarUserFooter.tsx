"use client";
import { RiExpandUpDownLine } from "@remixicon/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Avatar from "./ui/Avatar";

// Cartão do perfil no pé da barra lateral. Configurações ficam dentro do perfil.
export default function SidebarUserFooter({
  user,
}: {
  user: { email: string; name: string; image: string | null };
}) {
  const active = usePathname().startsWith("/perfil");
  return (
    <Link
      href="/perfil"
      aria-label="Abrir meu perfil"
      className={`m-2 flex items-center gap-3 rounded-xl p-2 transition duration-200 hover:bg-bg-weak-50 ${active ? "bg-bg-weak-50" : ""}`}
    >
      <Avatar name={user.name} image={user.image} size={32} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-label-sm text-text-strong-950">{user.name}</span>
        <span className="block truncate text-paragraph-xs text-text-sub-600">{user.email}</span>
      </span>
      <RiExpandUpDownLine className="size-5 flex-shrink-0 text-text-sub-600" />
    </Link>
  );
}
