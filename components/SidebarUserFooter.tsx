"use client";

import { signOut } from "next-auth/react";

export default function SidebarUserFooter({ email }: { email: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-surface-border px-4 py-3">
      <span className="truncate text-xs text-slate-500" title={email}>
        {email}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex-shrink-0 text-xs font-medium text-slate-500 hover:text-slate-900"
      >
        Sair
      </button>
    </div>
  );
}
