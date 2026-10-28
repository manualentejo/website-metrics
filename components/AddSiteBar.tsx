"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { inputClass } from "@/components/ui/fields";
import Select from "@/components/ui/Select";

export default function AddSiteBar({
  folders,
  defaultFolderId,
}: {
  folders: { id: string; name: string }[];
  defaultFolderId?: string;
}) {
  const [url, setUrl] = useState("");
  const [folderId, setFolderId] = useState(defaultFolderId ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function add() {
    if (!url.trim() || busy) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, folderId: folderId || null }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) return setMsg(data?.error ?? "Não foi possível adicionar.");
    setUrl("");
    setMsg("Site adicionado. A primeira análise roda no próximo horário agendado, ou use “Analisar agora” em Perfil › Análises.");
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-border bg-secondary/60 p-4">
      <p className="mb-2.5 flex items-center gap-2 text-[13px] text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5" />
        Comece a monitorar um novo site: cole o endereço abaixo.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="https://seusite.com"
          aria-label="Endereço do site"
          className={`${inputClass} min-w-[220px] flex-1`}
        />
        <Select value={folderId} onChange={(e) => setFolderId(e.target.value)} aria-label="Workspace" wrapperClassName="w-48">
          <option value="">Sem workspace</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </Select>
        <Button onClick={add} disabled={busy || !url.trim()}>
          <Plus className="h-4 w-4" />
          {busy ? "Adicionando…" : "Adicionar site"}
        </Button>
      </div>
      {msg && <p role="status" className="mt-2 text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}
