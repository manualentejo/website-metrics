import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { DEFAULT_WORKSPACE_ICON, isWorkspaceIcon } from "@/lib/workspaceIcons";

let ensured = false;
async function ensure() {
  if (ensured) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS folder_icons (
    folder_id uuid PRIMARY KEY REFERENCES folders(id) ON DELETE CASCADE,
    icon text NOT NULL
  )`);
  ensured = true;
}

/** Mapa id do workspace → id do ícone (quem não escolheu usa a pasta). */
export async function getFolderIcons(): Promise<Record<string, string>> {
  await ensure();
  const rows = (await db.execute(sql`SELECT folder_id::text AS id, icon FROM folder_icons`)) as unknown as { id: string; icon: string }[];
  return Object.fromEntries(rows.map((r) => [String(r.id), String(r.icon)]));
}

export async function setFolderIcon(folderId: string, icon: string) {
  await ensure();
  const clean = isWorkspaceIcon(icon) ? icon : DEFAULT_WORKSPACE_ICON;
  await db.execute(sql`INSERT INTO folder_icons (folder_id, icon) VALUES (${folderId}::uuid, ${clean})
    ON CONFLICT (folder_id) DO UPDATE SET icon = EXCLUDED.icon`);
}
