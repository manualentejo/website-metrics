import { createHmac, timingSafeEqual } from "crypto";

// Link assinado para compartilhar o PDF de um relatório sem exigir login. Vale por poucos dias e só
// abre o relatório daquela data, com os sites que a pessoa que gerou o link enxerga.
const DAY = 24 * 60 * 60 * 1000;
export const SHARE_DAYS = 14;

function secret() {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function shareAvailable() {
  return secret().length > 0;
}

export function makeShareToken(email: string, date: string) {
  const exp = Date.now() + SHARE_DAYS * DAY;
  const body = Buffer.from(JSON.stringify({ e: email.toLowerCase(), d: date, x: exp })).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Devolve o e-mail de quem gerou o link se o token for válido para essa data. */
export function readShareToken(token: string, date: string): string | null {
  if (!secret()) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as { e: string; d: string; x: number };
    if (p.d !== date || p.x < Date.now()) return null;
    return p.e;
  } catch {
    return null;
  }
}
