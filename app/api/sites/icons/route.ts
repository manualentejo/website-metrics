import { NextResponse } from "next/server";
import { getViewer } from "@/lib/access";
import { refreshMissingIcons } from "@/lib/siteIcons";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Descobre os ícones que faltam (só o dono). Chamado quando o painel nota um site sem ícone resolvido.
export async function POST() {
  const viewer = await getViewer();
  if (!viewer?.owner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  return NextResponse.json(await refreshMissingIcons());
}
