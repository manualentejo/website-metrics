"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiDeleteBinLine, RiRefreshLine, RiSettings3Line } from "@remixicon/react";
import Button from "@/components/ui/Button";
import Modal, { Field } from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import CopyBox from "@/components/CopyBox";
import { notification } from "@/hooks/use-notification";
import { inputClass } from "@/components/ui/fields";

interface Props {
  site: { id: string; name: string; url: string; folderId: string | null };
  folders: { id: string; name: string }[];
  snippet: string;
  defaultOpen?: boolean;
}

const bare = (u: string) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

// Configurações do site: nome, endereço, workspace e exclusão.
export default function SiteSettingsDialog({ site, folders, snippet, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [name, setName] = useState(site.name);
  const [url, setUrl] = useState(bare(site.url));
  const [folderId, setFolderId] = useState(site.folderId ?? "");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<null | "save" | "delete" | "analyze">(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const urlChanged = bare(url.trim()).toLowerCase() !== bare(site.url).toLowerCase();
  const dirty = name.trim() !== site.name || urlChanged || folderId !== (site.folderId ?? "");

  function close() {
    setOpen(false);
    setConfirming(false);
    setError(null);
    setName(site.name);
    setUrl(bare(site.url));
    setFolderId(site.folderId ?? "");
    if (defaultOpen) router.replace(`/site/${site.id}`);
  }

  async function save() {
    setBusy("save");
    setError(null);
    const res = await fetch("/api/sites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: site.id, name, folderId: folderId || null, ...(urlChanged ? { url } : {}) }),
    });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (!res.ok) return setError(data?.error ?? "Não foi possível salvar.");
    notification({ status: "success", variant: "filled", title: "Site atualizado" });
    setOpen(false);
    router.replace(`/site/${site.id}`);
    router.refresh();
  }

  async function reanalyze() {
    setBusy("analyze");
    setError(null);
    const res = await fetch("/api/sites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: site.id, reanalyze: true }),
    });
    setBusy(null);
    if (!res.ok) return setError("A análise falhou. Tente de novo em instantes.");
    notification({ status: "success", variant: "filled", title: "Análise concluída" });
    setOpen(false);
    router.replace(`/site/${site.id}`);
    router.refresh();
  }

  async function remove() {
    setBusy("delete");
    const res = await fetch(`/api/sites?id=${site.id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) return setError("Não foi possível excluir o site.");
    notification({ status: "success", variant: "filled", title: "Site excluído" });
    router.push("/sites");
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <RiSettings3Line className="h-4 w-4" />
        Configurar
      </Button>
      <Modal
        open={open}
        onClose={close}
        title={confirming ? `Excluir ${site.name}?` : "Configurações do site"}
        description={confirming ? undefined : "Mudanças valem só aqui no painel; o site em si não é alterado."}
        footer={
          confirming ? (
            <>
              <Button variant="outline" onClick={() => setConfirming(false)}>Manter site</Button>
              <Button variant="destructive" onClick={remove} disabled={busy === "delete"}>
                {busy === "delete" ? "Excluindo…" : "Excluir site"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={close}>Cancelar</Button>
              <Button onClick={save} disabled={!dirty || !name.trim() || busy === "save"}>
                {busy === "save" ? (urlChanged ? "Analisando o novo endereço…" : "Salvando…") : "Salvar alterações"}
              </Button>
            </>
          )
        }
      >
        {confirming ? (
          <div className="space-y-2 text-paragraph-sm text-text-sub-600">
            <p>Isso apaga o site do painel, com todas as notas, o histórico e as visitas registradas. Não dá para desfazer.</p>
            <p>O site na internet não é afetado.</p>
            {error && <p role="alert" className="text-paragraph-xs text-error-base">{error}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Nome do site">
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={`${inputClass} w-full`} />
            </Field>
            <Field
              label="Endereço (domínio)"
              hint={urlChanged ? "Ao salvar, o site é analisado de novo no endereço novo (cerca de 1 minuto). O histórico antigo continua." : undefined}
            >
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="seusite.com" className={`${inputClass} w-full`} />
            </Field>
            <Field label="Workspace">
              <Select value={folderId} onChange={(e) => setFolderId(e.target.value)} wrapperClassName="w-full">
                <option value="">Sem workspace</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Select>
            </Field>

            <details className="rounded-md border border-stroke-soft-200 px-3 py-2 text-paragraph-xs text-text-sub-600">
              <summary className="cursor-pointer font-medium text-text-strong-950">Contar visitas (opcional)</summary>
              <p className="mt-2">
                Só funciona em sites que você pode editar: o código precisa ser colado no site. Em sites de clientes, não instale sem
                autorização deles.
              </p>
              <div className="mt-2"><CopyBox text={snippet} /></div>
            </details>

            {error && <p role="alert" className="text-paragraph-xs text-error-base">{error}</p>}

            <div className="flex items-center justify-between gap-2 border-t border-stroke-soft-200 pt-3">
              <Button variant="outline" size="sm" onClick={reanalyze} disabled={busy !== null}>
                <RiRefreshLine className="h-3.5 w-3.5" />
                {busy === "analyze" ? "Analisando… (cerca de 1 min)" : "Analisar de novo"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirming(true)} className="text-error-base hover:text-error-base">
                <RiDeleteBinLine className="h-3.5 w-3.5" />
                Excluir site
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
