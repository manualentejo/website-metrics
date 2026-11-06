import { sql } from "drizzle-orm";
import { db } from "@/db/client";

// Armazenamento do chat da Numa no banco: SÓ as conversas favoritas (para economizar espaço).
// As demais conversas ficam no navegador de quem conversou. Também guarda o cache do resumo da Visão geral.

export const MAX_FAVORITES = 20;
const MAX_MESSAGES = 60;

let ensured = false;
async function ensure() {
  if (ensured) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS numa_chats (
    id uuid PRIMARY KEY,
    email text NOT NULL,
    title text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS numa_messages (
    id bigserial PRIMARY KEY,
    chat_id uuid NOT NULL REFERENCES numa_chats(id) ON DELETE CASCADE,
    role text NOT NULL,
    text text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS numa_chats_email ON numa_chats (email, updated_at DESC)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS numa_messages_chat ON numa_messages (chat_id, id)`);
  await db.execute(sql`CREATE TABLE IF NOT EXISTS numa_summaries (
    email text NOT NULL,
    hash text NOT NULL,
    text text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (email, hash)
  )`);
  ensured = true;
}

type Row = Record<string, unknown>;
const rows = (r: unknown) => r as Row[];

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}
export interface FavoriteChat {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export async function listFavorites(email: string): Promise<FavoriteChat[]> {
  await ensure();
  const chats = rows(await db.execute(sql`SELECT id::text AS id, title, updated_at FROM numa_chats WHERE email = ${email.toLowerCase()} ORDER BY updated_at DESC LIMIT ${MAX_FAVORITES}`));
  if (!chats.length) return [];
  const msgs = rows(
    await db.execute(sql`SELECT chat_id::text AS chat_id, role, text FROM numa_messages
      WHERE chat_id IN (SELECT id FROM numa_chats WHERE email = ${email.toLowerCase()}) ORDER BY id`)
  );
  return chats.map((c) => ({
    id: String(c.id),
    title: String(c.title),
    updatedAt: new Date(String(c.updated_at)).toISOString(),
    messages: msgs.filter((m) => String(m.chat_id) === String(c.id)).map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", text: String(m.text) }) as ChatMessage),
  }));
}

/** Cria ou atualiza uma conversa favorita (substitui as mensagens). Devolve false se passar do limite de favoritas. */
export async function upsertFavorite(email: string, chat: FavoriteChat): Promise<boolean> {
  await ensure();
  const mail = email.toLowerCase();
  const existing = rows(await db.execute(sql`SELECT email FROM numa_chats WHERE id = ${chat.id}::uuid`))[0];
  if (existing && String(existing.email) !== mail) return false; // id de outra pessoa
  if (!existing) {
    const [c] = rows(await db.execute(sql`SELECT count(*)::int AS n FROM numa_chats WHERE email = ${mail}`));
    if (Number(c.n) >= MAX_FAVORITES) return false;
  }
  const title = chat.title.replace(/\s+/g, " ").trim().slice(0, 80) || "Conversa";
  await db.execute(sql`INSERT INTO numa_chats (id, email, title, updated_at) VALUES (${chat.id}::uuid, ${mail}, ${title}, ${chat.updatedAt}::timestamptz)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = EXCLUDED.updated_at`);
  await db.execute(sql`DELETE FROM numa_messages WHERE chat_id = ${chat.id}::uuid`);
  for (const m of chat.messages.slice(-MAX_MESSAGES)) {
    await db.execute(sql`INSERT INTO numa_messages (chat_id, role, text) VALUES (${chat.id}::uuid, ${m.role}, ${m.text.slice(0, 20000)})`);
  }
  return true;
}

export async function removeFavorite(email: string, chatId: string) {
  await ensure();
  await db.execute(sql`DELETE FROM numa_chats WHERE id = ${chatId}::uuid AND email = ${email.toLowerCase()}`);
}

export async function getCachedSummary(email: string, hash: string): Promise<string | null> {
  await ensure();
  const r = rows(await db.execute(sql`SELECT text FROM numa_summaries WHERE email = ${email.toLowerCase()} AND hash = ${hash}`))[0];
  return r ? String(r.text) : null;
}

export async function saveSummary(email: string, hash: string, text: string) {
  await ensure();
  await db.execute(sql`INSERT INTO numa_summaries (email, hash, text) VALUES (${email.toLowerCase()}, ${hash}, ${text})
    ON CONFLICT (email, hash) DO UPDATE SET text = EXCLUDED.text, created_at = now()`);
  // Mantém só o resumo mais recente de cada pessoa (o texto antigo não serve mais quando os dados mudam).
  await db.execute(sql`DELETE FROM numa_summaries WHERE email = ${email.toLowerCase()} AND hash <> ${hash}`);
}
