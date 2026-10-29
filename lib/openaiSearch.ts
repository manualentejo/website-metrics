import type { GroundedAnswer } from "@/lib/geminiGrounded";

const MODEL = "gpt-4o-mini";

/** O ChatGPT só é consultado se existir a chave da OpenAI (OPENAI_API_KEY). */
export const openaiConfigured = () => Boolean(process.env.OPENAI_API_KEY);

/**
 * Pergunta ao ChatGPT (API da OpenAI, com busca na web ligada) como uma pessoa faria e devolve a resposta
 * com as páginas que ele citou. Se a busca for recusada, repete sem ela e marca `grounded: false`.
 */
export async function askOpenAI(prompt: string): Promise<GroundedAnswer> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not configured");

  for (const grounded of [true, false]) {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: MODEL, input: prompt, ...(grounded ? { tools: [{ type: "web_search_preview" }] } : {}) }),
    });
    if (!res.ok) {
      const body = await res.text();
      if (grounded && (res.status === 400 || res.status === 404)) continue; // sem a ferramenta de busca
      throw new Error(`OpenAI API ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      output?: { type: string; content?: { type: string; text?: string; annotations?: { type: string; url?: string; title?: string }[] }[] }[];
    };
    let text = "";
    const sources: { uri: string; title: string }[] = [];
    for (const item of data.output ?? []) {
      if (item.type !== "message") continue;
      for (const c of item.content ?? []) {
        if (c.type !== "output_text") continue;
        text += c.text ?? "";
        for (const a of c.annotations ?? []) {
          if (a.type === "url_citation" && a.url && !sources.some((s) => s.uri === a.url)) sources.push({ uri: a.url, title: a.title ?? "" });
        }
      }
    }
    if (!text.trim()) throw new Error("O ChatGPT não retornou uma resposta.");
    return { text: text.trim(), sources, grounded };
  }
  throw new Error("Erro desconhecido ao consultar o ChatGPT.");
}
