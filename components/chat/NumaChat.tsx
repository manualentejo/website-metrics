"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RiAddLine, RiAlarmWarningLine, RiArrowUpLine, RiDeleteBinLine, RiFileList3Line, RiHistoryLine, RiPencilLine, RiRobot2Line, RiStarFill, RiStarLine } from "@remixicon/react";
import Markdown from "@/components/gemini/Markdown";
import { notification } from "@/hooks/use-notification";
import type { ChatMessage } from "@/lib/numaChat";

interface Chat {
  id: string;
  title: string;
  updatedAt: string;
  favorite: boolean;
  messages: ChatMessage[];
}

const SUGGESTIONS = [
  { icon: RiAlarmWarningLine, text: "Qual site precisa de atenção primeiro?" },
  { icon: RiFileList3Line, text: "Resuma a semana dos meus sites" },
  { icon: RiRobot2Line, text: "Explique a nota GEO" },
];

const MAX_LOCAL_CHATS = 40;
const MAX_MESSAGES = 60;
const when = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" }).replace(".", "");
const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(16)}-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, "0")}`);

/**
 * Chat com a Numa. As conversas ficam guardadas neste navegador (não ocupam o banco do painel).
 * Só as favoritas (estrela) são salvas na sua conta, para aparecerem em qualquer aparelho.
 */
export default function NumaChat({ email, greeting }: { email: string; greeting: [string, string] }) {
  const storageKey = `numa-chats:${email.toLowerCase()}`;
  const [chats, setChats] = useState<Chat[]>([]);
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatsRef = useRef(chats);
  chatsRef.current = chats;

  // Carrega as conversas deste navegador e junta com as favoritas salvas na conta.
  useEffect(() => {
    let local: Chat[] = [];
    try {
      local = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    } catch {
      local = [];
    }
    setChats(local);
    setReady(true);
    fetch("/api/chat/favorites")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.favorites) return;
        setChats((cur) => {
          const byId = new Map(cur.map((c) => [c.id, c]));
          const serverIds = new Set<string>();
          for (const f of d.favorites as Omit<Chat, "favorite">[]) {
            serverIds.add(f.id);
            const mine = byId.get(f.id);
            // A versão mais recente vence.
            byId.set(f.id, !mine || new Date(f.updatedAt) >= new Date(mine.updatedAt) ? { ...f, favorite: true } : { ...mine, favorite: true });
          }
          // Favorita local que não existe mais na conta (removida em outro aparelho) vira conversa comum.
          for (const [id, c] of byId) if (c.favorite && !serverIds.has(id)) byId.set(id, { ...c, favorite: false });
          return [...byId.values()];
        });
      })
      .catch(() => {});
  }, [storageKey]);

  // Guarda no navegador a cada mudança (com limite, para não encher o armazenamento).
  useEffect(() => {
    if (!ready) return;
    try {
      const keep = [...chats].sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt.localeCompare(a.updatedAt)).slice(0, MAX_LOCAL_CHATS);
      localStorage.setItem(storageKey, JSON.stringify(keep.map((c) => ({ ...c, messages: c.messages.slice(-MAX_MESSAGES) }))));
    } catch {
      /* armazenamento cheio ou bloqueado: a conversa continua só na tela */
    }
  }, [chats, ready, storageKey]);

  const active = chats.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading, activeId]);

  const sorted = useMemo(() => [...chats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [chats]);
  const favorites = sorted.filter((c) => c.favorite);
  const recents = sorted.filter((c) => !c.favorite);

  const saveFavorite = useCallback(async (c: Chat) => {
    const res = await fetch("/api/chat/favorites", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, title: c.title, updatedAt: c.updatedAt, messages: c.messages.slice(-MAX_MESSAGES) }),
    }).catch(() => null);
    if (!res?.ok) {
      const d = await res?.json().catch(() => null);
      notification({ status: "error", variant: "filled", title: "Não consegui salvar a favorita", description: d?.error ?? "Tente de novo." });
      return false;
    }
    return true;
  }, []);

  function patch(id: string, fn: (c: Chat) => Chat) {
    setChats((cur) => cur.map((c) => (c.id === id ? fn(c) : c)));
  }

  async function toggleFavorite(c: Chat) {
    if (c.favorite) {
      patch(c.id, (x) => ({ ...x, favorite: false }));
      await fetch(`/api/chat/favorites/${c.id}`, { method: "DELETE" }).catch(() => {});
    } else {
      patch(c.id, (x) => ({ ...x, favorite: true }));
      if (!(await saveFavorite(c))) patch(c.id, (x) => ({ ...x, favorite: false }));
      else notification({ status: "success", variant: "filled", title: "Conversa favoritada", description: "Fica salva na sua conta." });
    }
  }

  async function commitRename(c: Chat) {
    const title = draftTitle.replace(/\s+/g, " ").trim().slice(0, 80);
    setEditing(null);
    if (!title || title === c.title) return;
    patch(c.id, (x) => ({ ...x, title }));
    if (c.favorite) await saveFavorite({ ...c, title });
  }

  async function remove(c: Chat) {
    setChats((cur) => cur.filter((x) => x.id !== c.id));
    if (activeId === c.id) setActiveId(null);
    if (c.favorite) await fetch(`/api/chat/favorites/${c.id}`, { method: "DELETE" }).catch(() => {});
  }

  function fresh() {
    setActiveId(null);
    setListOpen(false);
    inputRef.current?.focus();
  }

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    const now = new Date().toISOString();
    let id = activeId;
    const history = (chatsRef.current.find((c) => c.id === id)?.messages ?? []).slice(-12);
    if (!id) {
      id = newId();
      const created: Chat = { id, title: q.replace(/\s+/g, " ").slice(0, 60), updatedAt: now, favorite: false, messages: [] };
      setChats((cur) => [created, ...cur]);
      setActiveId(id);
    }
    const chatId = id;
    patch(chatId, (c) => ({ ...c, updatedAt: now, messages: [...c.messages, { role: "user", text: q }] }));
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: q, history }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `erro ${res.status}`);
      const done = new Date().toISOString();
      patch(chatId, (c) => ({ ...c, updatedAt: done, messages: [...c.messages, { role: "assistant", text: data.answer }] }));
      const latest = chatsRef.current.find((c) => c.id === chatId);
      if (latest?.favorite) void saveFavorite({ ...latest, updatedAt: done, messages: [...latest.messages, { role: "assistant", text: data.answer }] });
    } catch (e) {
      patch(chatId, (c) => ({
        ...c,
        messages: [...c.messages, { role: "assistant", text: `Não consegui responder agora: ${e instanceof Error ? e.message : "erro"}. Tente de novo em instantes.` }],
      }));
    } finally {
      setLoading(false);
    }
  }

  const Item = ({ c }: { c: Chat }) => (
    <li className="group relative">
      {editing === c.id ? (
        <input
          autoFocus
          value={draftTitle}
          maxLength={80}
          aria-label="Novo nome da conversa"
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={() => commitRename(c)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename(c);
            if (e.key === "Escape") setEditing(null);
          }}
          className="h-[3.25rem] w-full rounded-lg bg-bg-white-0 px-3 text-label-sm text-text-strong-950 ring-2 ring-stroke-strong-950 focus:outline-none"
        />
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setActiveId(c.id);
              setListOpen(false);
            }}
            onDoubleClick={() => {
              setEditing(c.id);
              setDraftTitle(c.title);
            }}
            aria-current={activeId === c.id ? "true" : undefined}
            className={`flex w-full flex-col rounded-lg px-3 py-2 pr-[5.5rem] text-left transition ${activeId === c.id ? "bg-[color:var(--accent-soft)]" : "hover:bg-bg-soft-200"}`}
          >
            <span className="truncate text-label-sm text-text-strong-950">{c.title}</span>
            <span className="text-paragraph-xs text-text-soft-400">{when(c.updatedAt)}</span>
          </button>
          <span className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => toggleFavorite(c)}
              aria-label={c.favorite ? `Desfavoritar: ${c.title}` : `Favoritar: ${c.title}`}
              aria-pressed={c.favorite}
              title={c.favorite ? "Desfavoritar" : "Favoritar (salva na sua conta)"}
              className="flex size-7 items-center justify-center rounded-md text-text-sub-600 hover:bg-bg-sub-300 hover:text-text-strong-950"
            >
              {c.favorite ? <RiStarFill className="size-4 text-warning-base" /> : <RiStarLine className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(c.id);
                setDraftTitle(c.title);
              }}
              aria-label={`Renomear: ${c.title}`}
              title="Renomear"
              className="flex size-7 items-center justify-center rounded-md text-text-sub-600 hover:bg-bg-sub-300 hover:text-text-strong-950"
            >
              <RiPencilLine className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => remove(c)}
              aria-label={`Excluir conversa: ${c.title}`}
              title="Excluir"
              className="flex size-7 items-center justify-center rounded-md text-text-sub-600 hover:bg-bg-sub-300 hover:text-error-base"
            >
              <RiDeleteBinLine className="size-4" />
            </button>
          </span>
          {c.favorite && <RiStarFill className="pointer-events-none absolute right-2 top-2 size-3.5 text-warning-base group-hover:hidden" aria-hidden />}
        </>
      )}
    </li>
  );

  const composer = (wrapper: string) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void send(input);
      }}
      className={wrapper}
    >
      <div className="glass-strong mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-stroke-strong-950">
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
          className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-paragraph-sm outline-none placeholder:text-text-soft-400"
        />
        <button type="submit" disabled={loading || !input.trim()} aria-label="Enviar" className="flex size-9 items-center justify-center rounded-xl bg-bg-strong-950 text-text-white-0 transition disabled:opacity-30">
          <RiArrowUpLine className="size-4" />
        </button>
      </div>
    </form>
  );

  const empty = messages.length === 0 && !loading;

  return (
    <div className="ai-gradient-soft absolute inset-0 flex lg:rounded-2xl">
      <aside
        className={`${listOpen ? "flex" : "hidden"} absolute inset-y-0 left-0 z-10 w-72 flex-col border-r border-white/60 bg-white/70 backdrop-blur-xl md:static md:flex md:w-64 md:flex-shrink-0 md:bg-white/50`}
        aria-label="Conversas"
      >
        <div className="p-3">
          <button type="button" onClick={fresh} className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-bg-strong-950 text-label-sm text-text-white-0 transition hover:opacity-90">
            <RiAddLine className="size-4" />
            Nova conversa
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {ready && chats.length === 0 && <p className="px-3 py-4 text-paragraph-xs text-text-sub-600">Suas conversas com a Numa aparecem aqui.</p>}
          {favorites.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-1 text-subheading-xs uppercase text-text-soft-400">Favoritas</p>
              <ul className="space-y-0.5">{favorites.map((c) => <Item key={c.id} c={c} />)}</ul>
            </>
          )}
          {recents.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-3 text-subheading-xs uppercase text-text-soft-400">Recentes</p>
              <ul className="space-y-0.5">{recents.map((c) => <Item key={c.id} c={c} />)}</ul>
            </>
          )}
        </div>
      </aside>

      <section className="relative flex min-w-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => setListOpen((o) => !o)}
          aria-label="Conversas"
          className="glass absolute left-3 top-3 z-20 flex size-9 items-center justify-center rounded-lg text-text-sub-600 md:hidden"
        >
          <RiHistoryLine className="size-5" />
        </button>

        {empty ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
            <h1 className="max-w-3xl text-center text-title-h3 tracking-[-1px] text-text-strong-950 sm:text-title-h2 sm:tracking-[-1px]">
              <span className="block">{greeting[0]}</span>
              <span className="block text-balance">{greeting[1]}</span>
            </h1>
            <div className="mt-9 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
              {SUGGESTIONS.map(({ icon: Icon, text }) => (
                <button key={text} type="button" onClick={() => send(text)} className="glass flex flex-col items-start gap-3 rounded-2xl p-4 text-left text-label-md text-text-strong-950 transition hover:bg-white/90">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/80 ring-1 ring-white">
                    <Icon className="size-5 text-text-sub-600" />
                  </span>
                  {text}
                </button>
              ))}
            </div>
            {composer("mt-6 w-full max-w-3xl")}
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-5 pt-14 sm:px-6 md:pt-6">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="ml-auto w-fit max-w-[min(800px,88%)] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-bg-strong-950 px-3.5 py-2 text-paragraph-sm text-text-white-0">
                    {m.text}
                  </div>
                ) : (
                  <div key={i} className="glass w-fit max-w-[min(800px,95%)] break-words rounded-2xl rounded-bl-md px-4 py-3 text-paragraph-sm text-text-strong-950">
                    <Markdown text={m.text} />
                  </div>
                )
              )}
              {loading && (
                <div className="glass flex w-fit items-center gap-1 rounded-2xl px-4 py-3" aria-label="A Numa está escrevendo">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="size-1.5 animate-bounce rounded-full bg-text-soft-400" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>
            {composer("flex-shrink-0 p-3 sm:p-4")}
          </>
        )}
      </section>
    </div>
  );
}
