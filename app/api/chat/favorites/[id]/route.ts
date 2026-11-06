import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/access";
import { removeFavorite } from "@/lib/numaChat";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  await removeFavorite(viewer.email, id);
  return NextResponse.json({ ok: true });
}
