const MODEL = "gemini-3.1-flash-lite";
const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface GroundedAnswer {
  text: string;
  /** Fontes que o Gemini consultou na busca do Google. `grounded` é false se a busca não pôde ser usada. */
  sources: { uri: string; title: string }[];
  grounded: boolean;
}

/**
 * Pergunta ao Gemini como uma pessoa faria, com a Busca do Google ligada, e devolve a resposta
 * junto com as fontes realmente consultadas (são elas que permitem verificar citações).
 * Se a ferramenta de busca for recusada, repete sem ela e marca `grounded: false`.
 */
export async function askGeminiGrounded(prompt: string): Promise<GroundedAnswer> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  for (const grounded of [true, false]) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          ...(grounded ? { tools: [{ google_search: {} }] } : {}),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const cand = data.candidates?.[0];
        const text = (cand?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").trim();
        if (!text) throw new Error("Gemini não retornou uma resposta.");
        const chunks: { web?: { uri?: string; title?: string } }[] = cand?.groundingMetadata?.groundingChunks ?? [];
        return {
          text,
          grounded,
          sources: chunks.filter((c) => c.web?.uri).map((c) => ({ uri: c.web!.uri!, title: c.web!.title ?? "" })),
        };
      }
      const body = await res.text();
      if (res.status === 400 && grounded) break; // ferramenta não aceita: tenta sem busca
      if ((res.status === 503 || res.status === 429) && attempt < MAX_ATTEMPTS) {
        await sleep(attempt * 1500);
        continue;
      }
      throw new Error(`Gemini API ${res.status}: ${body.slice(0, 300)}`);
    }
  }
  throw new Error("Erro desconhecido ao consultar o Gemini.");
}
