import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export interface AppSettings {
  enabled: boolean;
  weekday: number; // 0 = domingo … 6 = sábado (horário de Brasília)
  hour: number; // 0–23 (horário de Brasília)
  lastRunAt: string | null;
}

export const DEFAULT_SETTINGS: AppSettings = { enabled: true, weekday: 5, hour: 15, lastRunAt: null };

let ensured = false;
async function ensureTable() {
  if (ensured) return;
  await db.execute(sql`CREATE TABLE IF NOT EXISTS app_settings (key text PRIMARY KEY, value jsonb NOT NULL)`);
  ensured = true;
}

export async function getSettings(): Promise<AppSettings> {
  await ensureTable();
  const rows = await db.execute(sql`SELECT value FROM app_settings WHERE key = 'schedule'`);
  const value = (rows as unknown as { value: Partial<AppSettings> }[])[0]?.value ?? {};
  return { ...DEFAULT_SETTINGS, ...value };
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const next = { ...(await getSettings()), ...patch };
  await db.execute(
    sql`INSERT INTO app_settings (key, value) VALUES ('schedule', ${JSON.stringify(next)}::jsonb)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`
  );
  return next;
}

/** Data/hora atual em Brasília (UTC-3, sem horário de verão desde 2019). */
export function nowInBrasilia(date = new Date()) {
  const b = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return { weekday: b.getUTCDay(), hour: b.getUTCHours() };
}

export function isScheduledNow(s: AppSettings, now = new Date()): boolean {
  if (!s.enabled) return false;
  const b = nowInBrasilia(now);
  if (b.weekday !== s.weekday || b.hour !== s.hour) return false;
  return !s.lastRunAt || now.getTime() - new Date(s.lastRunAt).getTime() > 20 * 60 * 60 * 1000;
}
