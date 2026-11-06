"use client";

import { useState } from "react";
import { RiCloseLine, RiShareLine } from "@remixicon/react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { inputClass } from "@/components/ui/fields";
import { notification } from "@/hooks/use-notification";

/** Compartilha o workspace inteiro: a pessoa vê todos os sites dele, até você remover o acesso. */
export default function ShareWorkspaceButton({ folder }: { folder: { id: string; name: string } }) {
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState<string[] | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call(method: "GET" | "POST" | "DELETE", body?: object) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/folders/${folder.id}/access`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Não foi possível salvar.");
      setEmails(data.emails);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setBusy(false);
    }
  }

  function openDialog() {
    setOpen(true);
    if (emails === null) void call("GET");
  }

  async function add() {
    if (!email.trim()) return;
    if (await call("POST", { email })) {
      notification({ status: "success", variant: "filled", title: "Acesso concedido", description: `${email.trim().toLowerCase()} vê todos os sites de ${folder.name}.` });
      setEmail("");
    }
  }

  async function remove(e: string) {
    if (await call("DELETE", { email: e })) notification({ status: "success", variant: "filled", title: "Acesso removido" });
  }

  return (
    <>
      <Button variant="outline" onClick={openDialog}>
        <RiShareLine className="h-4 w-4" />
        Compartilhar
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Compartilhar ${folder.name}`}
        description="Quem você adicionar vê todos os sites deste workspace, inclusive os que entrarem depois. Você pode remover quando quiser."
        footer={<Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>}
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              type="email"
              placeholder="email@exemplo.com"
              aria-label="E-mail da pessoa"
              className={`${inputClass} min-w-0 flex-1`}
            />
            <Button onClick={add} disabled={busy || !email.trim()}>Compartilhar</Button>
          </div>
          {error && <p role="alert" className="text-paragraph-xs text-error-base">{error}</p>}
          <div>
            <p className="mb-1.5 text-label-xs uppercase tracking-wide text-text-soft-400">Com acesso</p>
            {emails === null ? (
              <p className="text-paragraph-sm text-text-sub-600">Carregando…</p>
            ) : emails.length === 0 ? (
              <p className="text-paragraph-sm text-text-sub-600">Ninguém ainda. Só você vê este workspace.</p>
            ) : (
              <ul className="divide-y divide-stroke-soft-200 rounded-xl ring-1 ring-inset ring-stroke-soft-200">
                {emails.map((e) => (
                  <li key={e} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate text-paragraph-sm text-text-strong-950">{e}</span>
                    <button
                      type="button"
                      onClick={() => remove(e)}
                      disabled={busy}
                      aria-label={`Remover acesso de ${e}`}
                      className="flex h-7 items-center gap-1 rounded-lg px-2 text-label-xs text-text-sub-600 hover:bg-bg-soft-200 hover:text-error-base disabled:opacity-50"
                    >
                      <RiCloseLine className="size-4" />
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
