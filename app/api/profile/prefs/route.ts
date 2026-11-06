import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/access";
import { getPrefs, resetPrefs, savePrefs } from "@/lib/prefs";
import { DEFAULT_PREFS } from "@/lib/theme";

export const dynamic = "force-dynamic";

// Aparência (tema e fonte) da própria pessoa.
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  return NextResponse.json({ prefs: (await getPrefs(viewer.email)) ?? DEFAULT_PREFS });
}

export async function PUT(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const body = await req.json().catch(() => null);
  return NextResponse.json({ prefs: await savePrefs(viewer.email, body) });
}

export async function DELETE() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  return NextResponse.json({ prefs: await resetPrefs(viewer.email) });
}
