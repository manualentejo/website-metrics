import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/access";
import { visibleSites } from "@/lib/insights";
import { FIX_STATES, setFixMeta, type FixState } from "@/lib/fixStatus";

export const dynamic = "force-dynamic";

// Marca uma tarefa da fila como a fazer / em andamento / feito e define o responsável.
export async function PATCH(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const b = (await req.json()) as { key?: string; siteId?: string; status?: string; assignee?: string | null };
  if (!b.key || !b.siteId || b.key.length > 300) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  if (!b.key.startsWith(`${b.siteId}|`)) return NextResponse.json({ error: "Chave inválida" }, { status: 400 });
  const site = (await visibleSites(viewer)).find((s) => s.id === b.siteId);
  if (!site) return NextResponse.json({ error: "Sem acesso" }, { status: 403 });

  const patch: { status?: FixState; assignee?: string | null } = {};
  if (b.status !== undefined) {
    if (!(FIX_STATES as string[]).includes(b.status)) return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    patch.status = b.status as FixState;
  }
  if (b.assignee !== undefined) patch.assignee = b.assignee ? String(b.assignee).trim().slice(0, 40) || null : null;
  return NextResponse.json(await setFixMeta(b.key, b.siteId, patch, viewer.email));
}
