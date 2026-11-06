import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/access";
import { askGemini } from "@/lib/gemini";
import { NUMA_PERSONA, portfolioFacts } from "@/lib/numa";
import { addMessages, createChat, getMessages, listChats, ownsChat } from "@/lib/numaChat";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  return NextResponse.json({ chats: await listChats(viewer.email) });
}

// Envia uma mensagem à Numa. Sem chatId, cria a conversa. Guarda pergunta e resposta no histórico.
export async function POST(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { chatId, message } = (await req.json()) as { chatId?: string; message?: string };
  const text = message?.trim();
  if (!text) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
  if (text.length > 4000) return NextResponse.json({ error: "Mensagem muito longa" }, { status: 400 });

  try {
    let id = chatId;
    if (id && !(await ownsChat(viewer.email, id))) return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    const history = id ? await getMessages(viewer.email, id, 12) : [];
    const { text: facts } = await portfolioFacts(viewer);
    const answer = await askGemini(`${NUMA_PERSONA}\n\nDados do portfólio (JSON):\n${facts}`, text, history);
    if (!id) id = await createChat(viewer.email, text);
    await addMessages(id, [
      { role: "user", text },
      { role: "assistant", text: answer },
    ]);
    return NextResponse.json({ chatId: id, answer });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao consultar a Numa" }, { status: 500 });
  }
}
