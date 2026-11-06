import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/access";
import { listFavorites, MAX_FAVORITES, upsertFavorite, type ChatMessage } from "@/lib/numaChat";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Conversas favoritas da pessoa (as únicas guardadas no banco).
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  return NextResponse.json({ favorites: await listFavorites(viewer.email) });
}

export async function PUT(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const b = (await req.json()) as { id?: string; title?: string; updatedAt?: string; messages?: ChatMessage[] };
  if (!b.id || !UUID.test(b.id) || !Array.isArray(b.messages)) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const messages = b.messages.filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.text === "string");
  const ok = await upsertFavorite(viewer.email, {
    id: b.id,
    title: b.title ?? "Conversa",
    updatedAt: b.updatedAt && !Number.isNaN(Date.parse(b.updatedAt)) ? new Date(b.updatedAt).toISOString() : new Date().toISOString(),
    messages,
  });
  if (!ok) return NextResponse.json({ error: `Você já tem ${MAX_FAVORITES} conversas favoritas. Desfavorite alguma antes.` }, { status: 409 });
  return NextResponse.json({ ok: true });
}
