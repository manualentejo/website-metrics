import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { DEFAULT_PREFS, normalizePrefs, type Prefs } from "@/lib/theme";

// Preferências de aparência de cada pessoa (tema e fonte), guardadas na conta para valer em qualquer aparelho.

let ensured = false;
async function ensure() {
  if (ensured) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS user_prefs (email text PRIMARY KEY, prefs jsonb NOT NULL)`);
  ensured = true;
}

export async function getPrefs(email: string): Promise<Prefs | null> {
  await ensure();
  const r = (await db.execute(sql`SELECT prefs FROM user_prefs WHERE email = ${email.toLowerCase()}`)) as unknown as { prefs: unknown }[];
  return r[0] ? normalizePrefs(r[0].prefs) : null;
}

export async function savePrefs(email: string, prefs: Prefs): Promise<Prefs> {
  await ensure();
  const clean = normalizePrefs(prefs);
  await db.execute(sql`INSERT INTO user_prefs (email, prefs) VALUES (${email.toLowerCase()}, ${JSON.stringify(clean)}::jsonb)
    ON CONFLICT (email) DO UPDATE SET prefs = EXCLUDED.prefs`);
  return clean;
}

export async function resetPrefs(email: string): Promise<Prefs> {
  await ensure();
  await db.execute(sql`DELETE FROM user_prefs WHERE email = ${email.toLowerCase()}`);
  return DEFAULT_PREFS;
}
