"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Pede ao servidor para descobrir os ícones que faltam (uma vez por sessão do navegador) e atualiza a tela. */
export default function IconBackfill() {
  const router = useRouter();
  useEffect(() => {
    try {
      if (sessionStorage.getItem("icons-backfill")) return;
      sessionStorage.setItem("icons-backfill", "1");
    } catch {
      /* sem sessionStorage: segue mesmo assim */
    }
    fetch("/api/sites/icons", { method: "POST" })
      .then((r) => r.json())
      .then((d) => d?.found > 0 && router.refresh())
      .catch(() => {});
  }, [router]);
  return null;
}
