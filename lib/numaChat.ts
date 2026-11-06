import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

// Histórico do chat com a Numa (o Gemini do painel). Cada pessoa só enxerga as próprias conversas.

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

export interface ChatSummary {
  id: string;
  title: string;
  updatedAt: string;
}
export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export async function listChats(email: string): Promise<ChatSummary[]> {
  await ensure();
  return rows(
    await db.execute(sql`SELECT id::text AS id, title, updated_at FROM numa_chats WHERE email = ${email.toLowerCase()} ORDER BY updated_at DESC LIMIT 100`)
  ).map((r) => ({ id: String(r.id), title: String(r.title), updatedAt: new Date(String(r.updated_at)).toISOString() }));
}

export async function ownsChat(email: string, chatId: string): Promise<boolean> {
  await ensure();
  return rows(await db.execute(sql`SELECT 1 FROM numa_chats WHERE id = ${chatId}::uuid AND email = ${email.toLowerCase()}`)).length > 0;
}

export async function getMessages(email: string, chatId: string, limit = 200): Promise<ChatMessage[]> {
  if (!(await ownsChat(email, chatId))) return [];
  const res = rows(
    await db.execute(sql`SELECT role, text FROM (SELECT id, role, text FROM numa_messages WHERE chat_id = ${chatId}::uuid ORDER BY id DESC LIMIT ${limit}) t ORDER BY id`)
  );
  return res.map((r) => ({ role: r.role === "assistant" ? "assistant" : "user", text: String(r.text) }));
}

export async function createChat(email: string, firstMessage: string): Promise<string> {
  await ensure();
  const id = randomUUID();
  const title = firstMessage.replace(/\s+/g, " ").trim().slice(0, 60) || "Nova conversa";
  await db.execute(sql`INSERT INTO numa_chats (id, email, title) VALUES (${id}::uuid, ${email.toLowerCase()}, ${title})`);
  return id;
}

export async function addMessages(chatId: string, msgs: ChatMessage[]) {
  await ensure();
  for (const m of msgs) await db.execute(sql`INSERT INTO numa_messages (chat_id, role, text) VALUES (${chatId}::uuid, ${m.role}, ${m.text.slice(0, 20000)})`);
  await db.execute(sql`UPDATE numa_chats SET updated_at = now() WHERE id = ${chatId}::uuid`);
}

export async function deleteChat(email: string, chatId: string) {
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
  // Mantém só os 10 resumos mais recentes de cada pessoa.
  await db.execute(sql`DELETE FROM numa_summaries WHERE email = ${email.toLowerCase()} AND hash NOT IN (
    SELECT hash FROM numa_summaries WHERE email = ${email.toLowerCase()} ORDER BY created_at DESC LIMIT 10)`);
}
