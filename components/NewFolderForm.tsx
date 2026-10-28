"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiFolderAddLine } from "@remixicon/react";
import Button from "@/components/ui/Button";
import Modal, { Field } from "@/components/ui/Modal";
import { inputClass } from "@/components/ui/fields";
import SiteChecklist, { type PickableSite } from "@/components/SiteChecklist";

// "Novo workspace": cria um grupo (pasta), dá um nome e já escolhe quais sites entram nele.
export default function NewWorkspace({ sites }: { sites: PickableSite[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function close() {
    setOpen(false);
    setName("");
    setPicked([]);
    setError(null);
  }

  async function create() {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), siteIds: picked }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) return setError(data?.error ?? "Não foi possível criar o workspace.");
    close();
    router.push(`/workspace/${data.id}`);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-paragraph-sm text-text-sub-600 transition-colors hover:bg-bg-weak-50 hover:text-text-strong-950"
      >
        <RiFolderAddLine className="h-4 w-4" />
        Novo workspace
      </button>
      <Modal
        open={open}
        onClose={close}
        title="Novo workspace"
        description="Um workspace é um grupo de sites, como uma pasta."
        footer={
          <>
            <Button variant="outline" onClick={close}>Cancelar</Button>
            <Button onClick={create} disabled={!name.trim() || saving}>{saving ? "Criando…" : "Criar workspace"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nome do workspace">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder="Ex.: Clientes de investimento"
              maxLength={60}
              className={`${inputClass} w-full`}
            />
          </Field>
          <div>
            <p className="mb-1 text-paragraph-xs font-medium text-text-strong-950">Sites do grupo (opcional)</p>
            <SiteChecklist sites={sites} selected={picked} onChange={setPicked} emptyText="Adicione um site primeiro para poder agrupá-lo." />
            <p className="mt-1 text-paragraph-xs text-text-sub-600">Um site fica em um workspace só: ao escolher, ele sai do anterior.</p>
          </div>
          {error && <p role="alert" className="text-paragraph-xs text-error-base">{error}</p>}
        </div>
      </Modal>
    </>
  );
}
