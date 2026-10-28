import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { sites } from "@/db/schema";
import { deviceFromWidth, ensureAnalyticsTable, visitorHash } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bare = (h: string) => h.replace(/^www\./, "").toLowerCase();

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Recebe uma visita enviada pelo script t.js instalado no site.
export async function POST(req: NextRequest) {
  const ok = () => new NextResponse(null, { status: 204, headers: CORS });
  try {
    const ua = req.headers.get("user-agent") ?? "";
    if (BOT.test(ua)) return ok();

    const b = JSON.parse(await req.text()) as { k?: string; p?: string; r?: string; w?: number };
    if (!b.k || !UUID.test(b.k) || typeof b.p !== "string") return ok();

    const [site] = await db.select().from(sites).where(eq(sites.id, b.k));
    if (!site) return ok();

    // Só aceita visitas vindas do endereço do próprio site.
    const origin = req.headers.get("origin");
    if (origin) {
      try {
        if (bare(new URL(origin).hostname) !== bare(new URL(site.url).hostname)) return ok();
      } catch {
        return ok();
      }
    }

    let referrer: string | null = null;
    if (b.r) {
      try {
        const h = bare(new URL(b.r).hostname);
        if (h && h !== bare(new URL(site.url).hostname)) referrer = h;
      } catch {}
    }

    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
    await ensureAnalyticsTable();
    await db.execute(sql`INSERT INTO pageviews (site_id, path, device, referrer, country, visitor)
      VALUES (${site.id}, ${(b.p.split("?")[0] || "/").slice(0, 200)}, ${deviceFromWidth(Number(b.w) || 1280)},
              ${referrer}, ${req.headers.get("x-vercel-ip-country")}, ${visitorHash(ip, ua, site.id)})`);
  } catch {
    // Nunca quebra o site de quem envia.
  }
  return ok();
}
