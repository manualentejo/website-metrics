"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RiArrowDownSLine, RiPlayLine, RiLoader4Line } from "@remixicon/react";
import { buttonClass } from "@/components/ui/Button";
import { notification } from "@/hooks/use-notification";

/**
 * Inicia uma auditoria (Lighthouse, ~1 min por site) usando a mesma rota "Analisar de novo"
 * das configurações. Com mais de um site, abre uma lista para escolher qual auditar.
 */
export default function RunAuditButton({
  sites,
  label = "Iniciar auditoria",
  variant = "primary",
}: {
  sites: { id: string; name: string }[];
  label?: string;
  variant?: "primary" | "outline";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  async function run(site: { id: string; name: string }) {
    setBusy(site.id);
    setOpen(false);
    notification({ status: "information", variant: "filled", title: `Auditando ${site.name}…`, description: "Leva cerca de 1 minuto." });
    const res = await fetch("/api/sites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: site.id, reanalyze: true }),
    }).catch(() => null);
    setBusy(null);
    if (!res?.ok) return notification({ status: "error", variant: "filled", title: `A auditoria de ${site.name} falhou`, description: "Tente de novo em instantes." });
    notification({ status: "success", variant: "filled", title: `Auditoria de ${site.name} concluída` });
    router.refresh();
  }

  if (!sites.length) return null;
  const single = sites.length === 1;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        disabled={busy !== null}
        aria-haspopup={single ? undefined : "menu"}
        aria-expanded={single ? undefined : open}
        onClick={() => (single ? run(sites[0]) : setOpen((o) => !o))}
        className={buttonClass(variant, "md")}
      >
        {busy ? <RiLoader4Line className="size-4 animate-spin" /> : <RiPlayLine className="size-4" />}
        {busy ? "Auditando…" : label}
        {!single && !busy && <RiArrowDownSLine className="size-4" />}
      </button>
      {open && !single && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-64 rounded-xl bg-bg-white-0 p-2 shadow-regular-md ring-1 ring-inset ring-stroke-soft-200">
          <p className="px-2 pb-1 text-label-xs text-text-soft-400">Escolha o site (cerca de 1 min)</p>
          <ul className="max-h-64 overflow-y-auto">
            {sites.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => run(s)}
                  className="flex h-9 w-full items-center rounded-lg px-2 text-left text-label-sm text-text-strong-950 hover:bg-bg-weak-50"
                >
                  <span className="truncate">{s.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
