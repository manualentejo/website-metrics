"use client";
import { RiArrowUpLine, RiSparklingLine, RiCloseLine } from "@remixicon/react";

import { useCallback, useEffect, useRef, useState } from "react";

import { OPEN_GEMINI_EVENT } from "@/lib/openGemini";
import Markdown from "./Markdown";

type Message = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "O que devo corrigir primeiro?",
  "Explique minhas notas em linguagem simples",
  "Por que o LCP está alto e como resolver no Framer?",
  "Como melhorar o SEO deste site?",
];

export default function GeminiDrawer({ siteId, siteName }: { siteId: string; siteName: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  const send = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q) return;
      const history = messagesRef.current.slice(-6);
      setMessages((prev) => [...prev, { role: "user", text: q }]);
      setInput("");
      setLoading(true);
      try {
        const res = await fetch(`/api/sites/${siteId}/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, history }),
        });
        const data = await res.json().catch(() => null);
        const text =
          res.ok && typeof data?.answer === "string"
            ? data.answer
            : res.status === 401
              ? "Sua sessão expirou. Recarregue a página e entre de novo."
              : `Não consegui responder agora: ${data?.error ?? `erro ${res.status}`}`;
        setMessages((prev) => [...prev, { role: "assistant", text }]);
      } catch {
        setMessages((prev) => [...prev, { role: "assistant", text: "Não consegui me conectar à IA. Tente de novo." }]);
      } finally {
        setLoading(false);
      }
    },
    [siteId]
  );

  useEffect(() => {
    function onOpen(e: Event) {
      const question = (e as CustomEvent<string | undefined>).detail;
      setOpen(true);
      if (question) send(question);
    }
    window.addEventListener(OPEN_GEMINI_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_GEMINI_EVENT, onOpen);
  }, [send]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <>
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-foreground/20 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Pergunte ao Gemini"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-stroke-soft-200 bg-bg-white-0 shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-stroke-soft-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-strong-950 text-text-white-0">
              <RiSparklingLine className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-text-strong-950">Pergunte ao Gemini</p>
              <p className="text-paragraph-xs text-text-sub-600">Sobre os dados de {siteName}</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="rounded-md p-1.5 text-text-sub-600 hover:bg-bg-weak-50 hover:text-text-strong-950/80"
          >
            <RiCloseLine className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.length === 0 && (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-text-sub-600">
                A IA lê o histórico e a análise completa do Lighthouse deste site e responde em linguagem simples,
                com soluções pensadas para sites feitos no Framer.
              </p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-lg border border-stroke-soft-200 px-3 py-2 text-left text-sm text-text-strong-950/80 transition-colors hover:bg-bg-weak-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-bg-strong-950 px-3.5 py-2 text-sm text-text-white-0">
                {m.text}
              </div>
            ) : (
              <div key={i} className="max-w-[95%] rounded-2xl rounded-bl-md bg-bg-weak-50 px-4 py-3 text-sm leading-relaxed text-text-strong-950/80">
                <Markdown text={m.text} />
              </div>
            )
          )}
          {loading && (
            <div className="flex w-fit items-center gap-1 rounded-2xl bg-bg-weak-50 px-4 py-3" aria-label="Gemini está escrevendo">
              {[0, 150, 300].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!loading) send(input);
          }}
          className="border-t border-stroke-soft-200 p-4"
        >
          <div className="flex items-end gap-2 rounded-xl border border-stroke-soft-200 bg-bg-white-0 p-2 focus-within:border-ring">
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!loading) send(input);
                }
              }}
              placeholder="Pergunte algo sobre este site…"
              className="max-h-32 flex-1 resize-none bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-text-sub-600"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Enviar pergunta"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-strong-950 text-text-white-0 transition-opacity disabled:opacity-30"
            >
              <RiArrowUpLine className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-paragraph-xs text-text-sub-600">A IA pode errar. Confira antes de aplicar mudanças.</p>
        </form>
      </aside>
    </>
  );
}
