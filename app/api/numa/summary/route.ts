import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/access";
import { askGemini } from "@/lib/gemini";
import { NUMA_PERSONA, portfolioFacts } from "@/lib/numa";
import { getCachedSummary, saveSummary } from "@/lib/numaChat";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Resumo da Numa sobre o portfólio. Fica em cache enquanto os dados não mudarem (uma chamada ao Gemini por mudança).
export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const refresh = req.nextUrl.searchParams.get("refresh") === "1";
  try {
    const { text, hash } = await portfolioFacts(viewer);
    if (!refresh) {
      const cached = await getCachedSummary(viewer.email, hash);
      if (cached) return NextResponse.json({ summary: cached, cached: true });
    }
    const summary = await askGemini(
      `${NUMA_PERSONA}\n\nDados do portfólio (JSON):\n${text}`,
      "Escreva o resumo da semana em no máximo 5 frases curtas. Comece pelo problema mais grave, se houver (cite site e número, por exemplo o tempo de carregamento). Depois diga a principal melhora e a principal piora e termine com a próxima ação mais útil, dizendo como fazer no Framer. Sem títulos, sem listas, só texto corrido. Use **negrito** só no site e no número principais."
    );
    await saveSummary(viewer.email, hash, summary);
    return NextResponse.json({ summary, cached: false });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erro ao consultar a Numa" }, { status: 500 });
  }
}
