"use client";

import { useState } from "react";

type Message = { role: "user" | "assistant"; text: string };

export default function ChatWidget({ siteId, siteName }: { siteId: string; siteName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/sites/${siteId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: res.ok ? data.answer : `Erro: ${data.error}` },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Erro ao conectar com a IA." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
      <h3 className="text-sm font-semibold text-slate-700">Pergunte à IA sobre o {siteName}</h3>
      <p className="mt-1 text-xs text-slate-400">
        A IA usa o histórico de análises deste site para responder suas dúvidas sobre performance e SEO.
      </p>

      <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">
            Experimente perguntar: &quot;por que o LCP mobile está alto?&quot; ou &quot;o que devo priorizar
            primeiro?&quot;
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
              m.role === "user" ? "ml-auto max-w-[85%] bg-slate-900 text-white" : "max-w-[85%] bg-slate-100 text-slate-700"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && <div className="max-w-[85%] rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-400">Pensando…</div>}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Digite sua pergunta..."
          className="flex-1 rounded-lg border border-surface-border bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
