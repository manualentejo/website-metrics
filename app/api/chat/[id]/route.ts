import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/access";
import { deleteChat, getMessages } from "@/lib/numaChat";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await params;
  return NextResponse.json({ messages: await getMessages(viewer.email, id) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await params;
  await deleteChat(viewer.email, id);
  return NextResponse.json({ ok: true });
}
