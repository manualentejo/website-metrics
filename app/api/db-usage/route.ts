import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { getViewer } from "@/lib/access";

export const dynamic = "force-dynamic";

type Row = Record<string, unknown>;
const rows = (r: unknown) => r as Row[];

// Quanto o banco ocupa e o que ocupa o espaço (só o dono). Nunca devolve credenciais: só o nome do provedor.
export async function GET() {
  const viewer = await getViewer();
  if (!viewer?.owner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL ?? "";
  const host = (url.match(/@([^/:?]+)/)?.[1] ?? "").toLowerCase();
  const provider = host.includes("neon") ? "Neon" : host.includes("supabase") ? "Supabase" : "desconhecido";
  // Limites de armazenamento dos planos gratuitos (conferir no painel do provedor, podem mudar).
  const limitBytes = provider === "Neon" ? 512 * 1024 * 1024 : provider === "Supabase" ? 500 * 1024 * 1024 : null;

  const [total] = rows(await db.execute(sql`SELECT pg_database_size(current_database())::bigint AS bytes`));
  const tables = rows(
    await db.execute(sql`SELECT c.relname AS name, pg_total_relation_size(c.oid)::bigint AS bytes, pg_relation_size(c.oid)::bigint AS table_bytes
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY 2 DESC`)
  );
  const counts: Record<string, number> = {};
  for (const t of tables) {
    const name = String(t.name);
    if (!/^[a-z_]+$/.test(name)) continue;
    const [c] = rows(await db.execute(sql.raw(`SELECT count(*)::int AS n FROM "${name}"`)));
    counts[name] = Number(c.n);
  }
  let snapshotParts: Record<string, number> | null = null;
  try {
    const [s] = rows(
      await db.execute(sql`SELECT coalesce(sum(pg_column_size(final_screenshot)),0)::bigint AS screenshots,
        coalesce(sum(pg_column_size(thumbnails)),0)::bigint AS thumbnails,
        coalesce(sum(pg_column_size(analysis)),0)::bigint AS analysis FROM snapshots`)
    );
    snapshotParts = { screenshots: Number(s.screenshots), thumbnails: Number(s.thumbnails), analysis: Number(s.analysis) };
  } catch {
    snapshotParts = null;
  }

  return NextResponse.json({
    provider,
    host: host.replace(/^[^.]+\./, "•••."),
    totalBytes: Number(total.bytes),
    limitBytes,
    tables: tables.map((t) => ({ name: String(t.name), bytes: Number(t.bytes), rows: counts[String(t.name)] ?? null })),
    snapshotParts,
  });
}
