"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiCloseLine, RiLoader4Line, RiPlayLine, RiSparklingLine } from "@remixicon/react";
import Button from "@/components/ui/Button";
import { inputClass } from "@/components/ui/fields";
import { Field } from "@/components/ui/Modal";
import { notification } from "@/hooks/use-notification";

interface Props {
  siteId: string;
  initial: { brand: string; description: string; competitors: string[] };
  configured: boolean;
  prompts: { id: string; prompt: string }[];
}

/** Configuração da visibilidade em IA: marca, concorrentes, prompts e botão de verificar. Só o dono vê. */
export default function GeoManager({ siteId, initial, configured, prompts }: Props) {
  const router = useRouter();
  const [brand, setBrand] = useState(initial.brand);
  const [description, setDescription] = useState(initial.description);
  const [competitors, setCompetitors] = useState(initial.competitors.join(", "));
  const [newPrompt, setNewPrompt] = useState("");
  const [busy, setBusy] = useState<null | "settings" | "suggest" | "run" | "add">(null);
  const [error, setError] = useState<string | null>(null);

  async function call(action: string, extra: Record<string, unknown> = {}) {
    const res = await fetch(`/api/sites/${siteId}/geo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? "Algo deu errado.");
    return data;
  }

  async function run(kind: typeof busy & string, fn: () => Promise<void>) {
    setBusy(kind);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const saveSettings = () =>
    run("settings", async () => {
      await call("settings", { brand, description, competitors: competitors.split(",").map((c) => c.trim()).filter(Boolean) });
      notification({ status: "success", variant: "filled", title: "Configuração salva" });
      router.refresh();
    });

  const suggest = () =>
    run("suggest", async () => {
      await call("settings", { brand, description, competitors: competitors.split(",").map((c) => c.trim()).filter(Boolean) });
      const r = await call("suggest");
      notification({ status: "success", variant: "filled", title: `${r.added} prompts sugeridos`, description: "Revise e remova os que não fazem sentido." });
      router.refresh();
    });

  const addPrompt = () =>
    run("add", async () => {
      await call("addPrompt", { prompt: newPrompt });
      setNewPrompt("");
      router.refresh();
    });

  const check = () =>
    run("run", async () => {
      const r = await call("run");
      notification({
        status: r.failed ? "warning" : "success",
        variant: "filled",
        title: "Verificação concluída",
        description: r.failed ? `${r.failed} prompt(s) falharam.` : `${r.done} prompts consultados.`,
      });
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome da marca" hint="Como as pessoas escrevem o nome. É isso que procuramos nas respostas.">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={80} className={`${inputClass} w-full`} />
        </Field>
        <Field label="Concorrentes (até 5, separados por vírgula)" hint="Contamos quantas vezes cada um aparece nas mesmas respostas.">
          <input value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="Marca A, Marca B" className={`${inputClass} w-full`} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="O que o site oferece (opcional)" hint="Uma frase. Ajuda o Gemini a sugerir prompts que fazem sentido.">
            <input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} placeholder="Ex.: escritório de arquitetura residencial em São Paulo" className={`${inputClass} w-full`} />
          </Field>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={saveSettings} disabled={!brand.trim() || busy !== null}>
          {busy === "settings" ? "Salvando…" : "Salvar configuração"}
        </Button>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-label-md text-text-strong-950">Prompts monitorados ({prompts.length}/20)</h3>
          <Button variant="outline" size="sm" onClick={suggest} disabled={!brand.trim() || busy !== null}>
            {busy === "suggest" ? <RiLoader4Line className="size-4 animate-spin" /> : <RiSparklingLine className="size-4" />}
            {busy === "suggest" ? "Pedindo ao Gemini…" : "Sugerir com Gemini"}
          </Button>
        </div>
        <p className="mb-3 text-paragraph-xs text-text-sub-600">
          Perguntas que um cliente faria a uma IA, sem citar sua marca. As sugestões são só ponto de partida: revise antes de verificar.
        </p>
        <ul className="divide-y divide-stroke-soft-200 rounded-xl ring-1 ring-inset ring-stroke-soft-200">
          {prompts.length === 0 && <li className="px-4 py-6 text-center text-paragraph-sm text-text-sub-600">Nenhum prompt ainda.</li>}
          {prompts.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="min-w-0 text-paragraph-sm text-text-strong-950">{p.prompt}</span>
              <button
                type="button"
                aria-label={`Remover prompt: ${p.prompt}`}
                onClick={() => run("add", async () => { await call("removePrompt", { promptId: p.id }); router.refresh(); })}
                className="flex size-7 flex-shrink-0 items-center justify-center rounded-lg text-text-sub-600 hover:bg-bg-weak-50 hover:text-error-base"
              >
                <RiCloseLine className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <input
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && newPrompt.trim() && addPrompt()}
            placeholder="Escreva um prompt, por exemplo: qual a melhor … em …?"
            className={`${inputClass} min-w-0 flex-1`}
            maxLength={300}
          />
          <Button variant="outline" onClick={addPrompt} disabled={newPrompt.trim().length < 5 || busy !== null}>Adicionar</Button>
        </div>
      </div>

      {error && <p role="alert" className="text-paragraph-xs text-error-base">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 border-t border-stroke-soft-200 pt-4">
        <Button onClick={check} disabled={!configured || prompts.length === 0 || busy !== null}>
          {busy === "run" ? <RiLoader4Line className="size-4 animate-spin" /> : <RiPlayLine className="size-4" />}
          {busy === "run" ? "Consultando o Gemini…" : "Verificar agora"}
        </Button>
        <p className="text-paragraph-xs text-text-sub-600">
          {configured ? "Leva de 20 segundos a 2 minutos, conforme o número de prompts." : "Salve a configuração para liberar a verificação."}
        </p>
      </div>
    </div>
  );
}
