const MODEL = "gemini-3.8-flash";
const MAX_ATTEMPTS = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function askGemini(systemContext: string, question: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemContext }] },
        contents: [{ role: "user", parts: [{ text: question }] }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini não retornou uma resposta.");
      return text;
    }

    const body = await res.text();
    lastError = new Error(`Gemini API ${res.status}: ${body.slice(0, 500)}`);

    const retryable = res.status === 503 || res.status === 429;
    if (!retryable || attempt === MAX_ATTEMPTS) break;
    await sleep(attempt * 1500);
  }

  throw lastError ?? new Error("Erro desconhecido ao consultar o Gemini.");
}
