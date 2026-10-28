"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function SidebarUserFooter({ email }: { email: string }) {
  return (
    <div className="m-3 flex items-center gap-2.5 rounded-xl bg-card p-2.5 shadow-sm ring-1 ring-border">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold uppercase text-primary-foreground">
        {email[0]}
      </span>
      <span className="flex-1 truncate text-xs text-muted-foreground" title={email}>
        {email}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        aria-label="Sair"
        title="Sair"
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
