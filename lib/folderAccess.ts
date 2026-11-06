import { sql } from "drizzle-orm";
import { db } from "@/db/client";

// Compartilhamento de workspace inteiro: quem está na lista vê todos os sites do workspace
// (inclusive os adicionados depois) até o acesso ser removido.

let ensured = false;
export async function ensureFolderAccessTable() {
  if (ensured) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS folder_access (
    folder_id uuid NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    email text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (folder_id, email)
  )`);
  ensured = true;
}

type Row = Record<string, unknown>;
const rows = (r: unknown) => r as Row[];

export async function listFolderAccess(folderId: string): Promise<string[]> {
  await ensureFolderAccessTable();
  return rows(await db.execute(sql`SELECT email FROM folder_access WHERE folder_id = ${folderId}::uuid ORDER BY created_at`)).map((r) => String(r.email));
}

export async function addFolderAccess(folderId: string, email: string) {
  await ensureFolderAccessTable();
  await db.execute(sql`INSERT INTO folder_access (folder_id, email) VALUES (${folderId}::uuid, ${email.trim().toLowerCase()}) ON CONFLICT DO NOTHING`);
}

export async function removeFolderAccess(folderId: string, email: string) {
  await ensureFolderAccessTable();
  await db.execute(sql`DELETE FROM folder_access WHERE folder_id = ${folderId}::uuid AND email = ${email.trim().toLowerCase()}`);
}

/** Ids dos sites de workspaces compartilhados com este e-mail. */
export async function siteIdsViaFolders(email: string): Promise<string[]> {
  await ensureFolderAccessTable();
  return rows(
    await db.execute(sql`SELECT s.id::text AS id FROM folder_access fa JOIN sites s ON s.folder_id = fa.folder_id WHERE fa.email = ${email.toLowerCase()}`)
  ).map((r) => String(r.id));
}
