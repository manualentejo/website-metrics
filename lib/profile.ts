import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export interface Profile {
  name: string | null;
  role: string | null;
  image: string | null; // data URL (foto reduzida no navegador) ou URL da conta Google
}

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS user_profiles (email text PRIMARY KEY, name text, role text, image text)`
  );
  ensured = true;
}

export async function getProfile(email: string): Promise<Partial<Profile>> {
  await ensureTable();
  const rows = await db.execute(
    sql`SELECT name, role, image FROM user_profiles WHERE email = ${email.toLowerCase()}`
  );
  return (rows as unknown as Partial<Profile>[])[0] ?? {};
}

export async function saveProfile(email: string, patch: Partial<Profile>): Promise<Partial<Profile>> {
  const next = { ...(await getProfile(email)), ...patch };
  await db.execute(
    sql`INSERT INTO user_profiles (email, name, role, image)
        VALUES (${email.toLowerCase()}, ${next.name ?? null}, ${next.role ?? null}, ${next.image ?? null})
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, image = EXCLUDED.image`
  );
  return next;
}
