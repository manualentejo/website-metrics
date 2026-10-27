const MODEL = "gemini-3.8-flash";
const FALLBACK_MODEL = "gemini-2.0-flash";

async function callGemini(model: string, apiKey: string, systemContext: string, question: string) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemContext }] },
      contents: [{ role: "user", parts: [{ text: question }] }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini não retornou uma resposta.");
  }
  return text;
}

export async function askGemini(systemContext: string, question: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  try {
    return await callGemini(MODEL, apiKey, systemContext, question);
  } catch (err) {
    // O modelo mais novo às vezes fica temporariamente sobrecarregado (503);
    // nesse caso, cai para um modelo estável como alternativa.
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("503") || message.includes("UNAVAILABLE")) {
      return await callGemini(FALLBACK_MODEL, apiKey, systemContext, question);
    }
    throw err;
  }
}
