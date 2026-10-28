"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiAddLine, RiDeleteBinLine, RiPencilLine } from "@remixicon/react";
import Button from "@/components/ui/Button";
import Modal, { Field } from "@/components/ui/Modal";
import { inputClass } from "@/components/ui/fields";
import SiteChecklist, { type PickableSite } from "@/components/SiteChecklist";

type Dialog = null | "add" | "rename" | "delete";

// Ações do workspace aberto: pôr sites no grupo, renomear e excluir o grupo.
export default function WorkspaceActions({
  folder,
  candidates,
  siteCount,
}: {
  folder: { id: string; name: string };
  candidates: PickableSite[]; // sites que ainda não estão neste workspace
  siteCount: number;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [name, setName] = useState(folder.name);
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function close() {
    setDialog(null);
    setPicked([]);
    setName(folder.name);
    setError(null);
  }

  async function call(method: "PATCH" | "DELETE", body?: object) {
    setSaving(true);
    setError(null);
    const res = await fetch(method === "DELETE" ? `/api/folders?id=${folder.id}` : "/api/folders", {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify({ id: folder.id, ...body }) : undefined,
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) return setError(data?.error ?? "Não foi possível salvar.");
    close();
    if (method === "DELETE") router.push("/");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => setDialog("add")}>
          <RiAddLine className="h-4 w-4" />
          Adicionar sites
        </Button>
        <Button variant="outline" size="icon" aria-label="Renomear workspace" title="Renomear" onClick={() => setDialog("rename")}>
          <RiPencilLine className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Excluir workspace" title="Excluir workspace" onClick={() => setDialog("delete")}>
          <RiDeleteBinLine className="h-4 w-4" />
        </Button>
      </div>

      <Modal
        open={dialog === "add"}
        onClose={close}
        title={`Adicionar sites a ${folder.name}`}
        description="Escolha os sites que entram neste grupo."
        footer={
          <>
            <Button variant="outline" onClick={close}>Cancelar</Button>
            <Button disabled={!picked.length || saving} onClick={() => call("PATCH", { addSiteIds: picked })}>
              {saving ? "Adicionando…" : "Adicionar ao grupo"}
            </Button>
          </>
        }
      >
        <SiteChecklist sites={candidates} selected={picked} onChange={setPicked} emptyText="Todos os sites já estão neste workspace." />
        {error && <p role="alert" className="mt-2 text-paragraph-xs text-error-base">{error}</p>}
      </Modal>

      <Modal
        open={dialog === "rename"}
        onClose={close}
        title="Renomear workspace"
        footer={
          <>
            <Button variant="outline" onClick={close}>Cancelar</Button>
            <Button disabled={!name.trim() || name.trim() === folder.name || saving} onClick={() => call("PATCH", { name })}>
              {saving ? "Salvando…" : "Salvar nome"}
            </Button>
          </>
        }
      >
        <Field label="Nome do workspace">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && call("PATCH", { name })}
            maxLength={60}
            className={`${inputClass} w-full`}
          />
        </Field>
        {error && <p role="alert" className="mt-2 text-paragraph-xs text-error-base">{error}</p>}
      </Modal>

      <Modal
        open={dialog === "delete"}
        onClose={close}
        title={`Excluir o workspace ${folder.name}?`}
        footer={
          <>
            <Button variant="outline" onClick={close}>Manter workspace</Button>
            <Button variant="destructive" disabled={saving} onClick={() => call("DELETE")}>
              {saving ? "Excluindo…" : "Excluir workspace"}
            </Button>
          </>
        }
      >
        <p className="text-paragraph-sm text-text-sub-600">
          {siteCount > 0
            ? `Só o grupo é excluído. Os ${siteCount} ${siteCount === 1 ? "site continua" : "sites continuam"} no painel, em “Sem workspace”.`
            : "O grupo está vazio e será removido."}
        </p>
        {error && <p role="alert" className="mt-2 text-paragraph-xs text-error-base">{error}</p>}
      </Modal>
    </>
  );
}
