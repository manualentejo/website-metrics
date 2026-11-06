"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PREFS_COOKIE, normalizePrefs, parsePrefsCookie, serializePrefs, type Prefs } from "@/lib/theme";

/**
 * Se a aparência salva na conta for diferente da deste navegador (por exemplo, você mudou em outro aparelho),
 * atualiza o cookie local e redesenha a página com o tema certo.
 */
export default function ThemeSync({ saved }: { saved: Prefs | null }) {
  const router = useRouter();
  useEffect(() => {
    if (!saved) return;
    const m = document.cookie.match(new RegExp(`(?:^|; )${PREFS_COOKIE}=([^;]*)`));
    const local = parsePrefsCookie(m?.[1]);
    if (JSON.stringify(normalizePrefs(saved)) === JSON.stringify(local)) return;
    document.cookie = `${PREFS_COOKIE}=${serializePrefs(saved)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [saved, router]);
  return null;
}
