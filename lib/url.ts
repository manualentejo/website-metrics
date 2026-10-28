/** Normaliza o endereço digitado para `https://dominio/`. Retorna null se for inválido. */
export function normalizeSiteUrl(input: string | undefined | null): { url: string; host: string } | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!parsed.hostname.includes(".")) return null;
    return { url: `${parsed.origin}/`, host: parsed.hostname.replace(/^www\./, "") };
  } catch {
    return null;
  }
}

export function nameFromHost(host: string): string {
  return host.split(".")[0].replace(/^./, (c) => c.toUpperCase());
}
