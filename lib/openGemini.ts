export const OPEN_GEMINI_EVENT = "open-gemini";

/** Abre o painel lateral do Gemini, opcionalmente já enviando uma pergunta. */
export function openGemini(question?: string) {
  window.dispatchEvent(new CustomEvent<string | undefined>(OPEN_GEMINI_EVENT, { detail: question }));
}
