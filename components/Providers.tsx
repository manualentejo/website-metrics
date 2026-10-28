"use client";

import { SessionProvider } from "next-auth/react";
import { Provider as TooltipProvider } from "@/components/align/tooltip";
import { NotificationProvider } from "@/components/align/notification-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider>{children}</TooltipProvider>
      <NotificationProvider />
    </SessionProvider>
  );
}
