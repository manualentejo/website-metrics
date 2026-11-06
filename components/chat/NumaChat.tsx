"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RiAddLine, RiArrowUpLine, RiDeleteBinLine, RiHistoryLine, RiSparklingLine } from "@remixicon/react";
import Markdown from "@/components/gemini/Markdown";
import type { ChatMessage, ChatSummary } from "@/lib/numaChat";

const SUGGESTIONS = [
  "Qual site precisa de atenção primeiro?",
  "Resuma a semana dos meus sites",
  "Explique a nota GEO em linguagem simples",
  "O que é LCP e como melhorar no Framer?",
];

const when = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }).replace(".", "");

/** Chat com a Numa: conversas salvas à esquerda, mensagens e campo de envio à direita. */
export default function NumaChat({ initialChats }: { initialChats: ChatSummary[] }) {
  const [chats, setChats] = useState(initialChats);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const refreshList = useCallback(async () => {
    const r = await fetch("/api/chat").then((x) => x.json()).catch(() => null);
    if (r?.chats) setChats(r.chats);
  }, []);

  async function select(id: string) {
    setActiveId(id);
    setListOpen(false);
    setMessages([]);
    const r = await fetch(`/api/chat/${id}`).then((x) => x.json()).catch(() => null);
    setMessages(r?.messages ?? []);
  }

  function fresh() {
    setActiveId(null);
    setMessages([]);
    setListOpen(false);
    inputRef.current?.focus();
  }

  async function remove(id: string) {
    await fetch(`/api/chat/${id}`, { method: "DELETE" }).catch(() => {});
    setChats((c) => c.filter((x) => x.id !== id));
    if (activeId === id) fresh();
  }

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chatId: activeId, message: q }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `erro ${res.status}`);
      setMessages((m) => [...m, { role: "assistant", text: data.answer }]);
      if (!activeId) setActiveId(data.chatId);
      void refreshList();
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: `Não consegui responder agora: ${e instanceof Error ? e.message : "erro"}. Tente de novo em instantes.` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="absolute inset-0 flex bg-bg-white-0 lg:rounded-2xl">
      <aside
        className={`${listOpen ? "flex" : "hidden"} absolute inset-y-0 left-0 z-10 w-72 flex-col border-r border-stroke-soft-200 bg-bg-white-0 md:static md:flex md:w-64 md:flex-shrink-0`}
        aria-label="Conversas"
      >
        <div className="p-3">
          <button
            type="button"
            onClick={fresh}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-bg-strong-950 text-label-sm text-text-white-0 transition hover:opacity-90"
          >
            <RiAddLine className="size-4" />
            Nova conversa
          </button>
        </div>
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {chats.length === 0 && <li className="px-3 py-4 text-paragraph-xs text-text-sub-600">Suas conversas com a Numa ficam salvas aqui.</li>}
          {chats.map((c) => (
            <li key={c.id} className="group relative">
              <button
                type="button"
                onClick={() => select(c.id)}
                aria-current={activeId === c.id ? "true" : undefined}
                className={`flex w-full flex-col rounded-lg px-3 py-2 pr-9 text-left transition ${activeId === c.id ? "bg-bg-soft-200" : "hover:bg-bg-weak-50"}`}
              >
                <span className="truncate text-label-sm text-text-strong-950">{c.title}</span>
                <span className="text-paragraph-xs text-text-soft-400">{when(c.updatedAt)}</span>
              </button>
              <button
                type="button"
                onClick={() => remove(c.id)}
                aria-label={`Excluir conversa: ${c.title}`}
                className="absolute right-1.5 top-2 flex size-7 items-center justify-center rounded-md text-text-soft-400 opacity-0 transition hover:bg-bg-soft-200 hover:text-error-base focus-visible:opacity-100 group-hover:opacity-100"
              >
                <RiDeleteBinLine className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-shrink-0 items-center gap-3 border-b border-stroke-soft-200 px-4 py-3">
          <button type="button" onClick={() => setListOpen((o) => !o)} aria-label="Conversas" className="flex size-8 items-center justify-center rounded-lg text-text-sub-600 hover:bg-bg-weak-50 md:hidden">
            <RiHistoryLine className="size-5" />
          </button>
          <span className="flex size-8 items-center justify-center rounded-lg bg-bg-strong-950 text-text-white-0">
            <RiSparklingLine className="size-4" />
          </span>
          <div>
            <h1 className="text-label-md text-text-strong-950">Numa</h1>
            <p className="text-paragraph-xs text-text-sub-600">Sabe das notas e dos alertas dos seus sites</p>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {messages.length === 0 && !loading && (
            <div className="mx-auto max-w-xl space-y-4 pt-6 sm:pt-12">
              <div>
                <p className="text-title-h6 text-text-strong-950">Oi, eu sou a Numa.</p>
                <p className="mt-1 text-paragraph-sm text-text-sub-600">Pergunte sobre desempenho, SEO ou GEO dos seus sites. Eu explico em linguagem simples e digo como corrigir no Framer.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="rounded-xl bg-bg-white-0 px-3 py-2.5 text-left text-paragraph-sm text-text-strong-950 ring-1 ring-inset ring-stroke-soft-200 transition hover:bg-bg-weak-50 hover:ring-stroke-sub-300">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-bg-strong-950 px-3.5 py-2 text-paragraph-sm text-text-white-0 sm:max-w-[70%]">
                {m.text}
              </div>
            ) : (
              <div key={i} className="max-w-[95%] rounded-2xl rounded-bl-md bg-bg-weak-50 px-4 py-3 text-paragraph-sm text-text-strong-950 sm:max-w-[80%]">
                <Markdown text={m.text} />
              </div>
            )
          )}
          {loading && (
            <div className="flex w-fit items-center gap-1 rounded-2xl bg-bg-weak-50 px-4 py-3" aria-label="A Numa está escrevendo">
              {[0, 150, 300].map((d) => (
                <span key={d} className="size-1.5 animate-bounce rounded-full bg-text-soft-400" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex-shrink-0 border-t border-stroke-soft-200 p-3 sm:p-4"
        >
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl bg-bg-white-0 p-2 ring-1 ring-inset ring-stroke-soft-200 focus-within:ring-stroke-strong-950">
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder="Escreva sua pergunta para a Numa…"
              aria-label="Mensagem para a Numa"
              className="max-h-32 flex-1 resize-none bg-transparent px-1.5 py-1 text-paragraph-sm outline-none placeholder:text-text-soft-400"
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Enviar" className="flex size-8 items-center justify-center rounded-lg bg-bg-strong-950 text-text-white-0 transition disabled:opacity-30">
              <RiArrowUpLine className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-paragraph-xs text-text-soft-400">A Numa pode errar. Confira antes de aplicar mudanças.</p>
        </form>
      </section>
    </div>
  );
}
