import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/access";
import { askGemini } from "@/lib/gemini";
import { NUMA_PERSONA, portfolioFacts } from "@/lib/numa";
import { getProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Envia uma mensagem à Numa. Não grava nada no banco: o navegador manda o histórico da conversa junto
// e guarda as respostas localmente (só as conversas favoritas vão para o banco, por outra rota).
export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { message, history } = (await req.json()) as { message?: string; history?: { role: string; text: string }[] };
  const text = message?.trim();
  if (!text) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
  if (text.length > 4000) return NextResponse.json({ error: "Mensagem muito longa" }, { status: 400 });

  const safeHistory = (history ?? [])
    .filter((t) => (t.role === "user" || t.role === "assistant") && typeof t.text === "string")
    .slice(-12)
    .map((t) => ({ role: t.role as "user" | "assistant", text: t.text.slice(0, 6000) }));

  try {
    const [{ text: facts }, profile] = await Promise.all([portfolioFacts(viewer), getProfile(viewer.email).catch(() => ({}) as { nickname?: string | null })]);
    const who = profile.nickname?.trim() ? `

A pessoa pede para ser chamada de "${profile.nickname.trim()}". Use esse apelido de vez em quando, sem exagero.` : "";
    const answer = await askGemini(`${NUMA_PERSONA}${who}\n\nDados do portfólio (JSON):\n${facts}`, text, safeHistory);
    return NextResponse.json({ answer });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao consultar a Numa" }, { status: 500 });
  }
}
