import { RiExpandUpDownLine } from "@remixicon/react";
import Link from "next/link";

import Avatar from "./ui/Avatar";

// Cartão do perfil no pé da barra lateral. Configurações ficam dentro do perfil.
export default function SidebarUserFooter({
  user,
  active,
}: {
  user: { email: string; name: string; image: string | null };
  active?: boolean;
}) {
  return (
    <Link
      href="/perfil"
      aria-label="Abrir meu perfil"
      className={`m-2 flex items-center gap-2.5 rounded-md p-2 transition-colors hover:bg-accent/60 ${active ? "bg-accent" : ""}`}
    >
      <Avatar name={user.name} image={user.image} size={32} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-foreground">{user.name}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{user.email}</span>
      </span>
      <RiExpandUpDownLine className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
    </Link>
  );
}
