import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export type FixState = "todo" | "doing" | "done";
export const FIX_STATES: FixState[] = ["todo", "doing", "done"];

export interface FixMeta {
  status: FixState;
  assignee: string | null;
}

let ensured = false;
async function ensure() {
  if (ensured) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS fix_status (
    task_key text PRIMARY KEY,
    site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    status text NOT NULL DEFAULT 'todo',
    assignee text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by text
  )`);
  ensured = true;
}

/** Status e responsável de cada tarefa da fila (só existe linha para tarefas que alguém mexeu). */
export async function getFixMeta(): Promise<Map<string, FixMeta>> {
  await ensure();
  const rows = (await db.execute(sql`SELECT task_key, status, assignee FROM fix_status`)) as unknown as { task_key: string; status: string; assignee: string | null }[];
  return new Map(rows.map((r) => [r.task_key, { status: (FIX_STATES as string[]).includes(r.status) ? (r.status as FixState) : "todo", assignee: r.assignee }]));
}

export async function setFixMeta(key: string, siteId: string, patch: { status?: FixState; assignee?: string | null }, by: string) {
  await ensure();
  const cur = (await getFixMeta()).get(key) ?? { status: "todo" as FixState, assignee: null };
  const next = { status: patch.status ?? cur.status, assignee: patch.assignee === undefined ? cur.assignee : patch.assignee };
  if (next.status === "todo" && !next.assignee) {
    await db.execute(sql`DELETE FROM fix_status WHERE task_key = ${key}`);
    return next;
  }
  await db.execute(sql`INSERT INTO fix_status (task_key, site_id, status, assignee, updated_by)
    VALUES (${key}, ${siteId}, ${next.status}, ${next.assignee}, ${by})
    ON CONFLICT (task_key) DO UPDATE SET status = EXCLUDED.status, assignee = EXCLUDED.assignee, updated_at = now(), updated_by = EXCLUDED.updated_by`);
  return next;
}

/** Nomes já usados como responsável, para sugerir no campo. */
export async function knownAssignees(): Promise<string[]> {
  await ensure();
  const rows = (await db.execute(sql`SELECT DISTINCT assignee FROM fix_status WHERE assignee IS NOT NULL ORDER BY assignee`)) as unknown as { assignee: string }[];
  return rows.map((r) => r.assignee);
}
