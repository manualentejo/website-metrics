import { NextRequest, NextResponse } from "next/server";
import { runAnalysis } from "@/lib/runAnalysis";
import { getSettings, isScheduledNow } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Chamado de hora em hora por um agendador externo (GitHub Actions). Só executa
// quando dia/hora (Brasília) batem com a configuração; ?force=1 ignora o horário.
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "PAGESPEED_API_KEY not configured" }, { status: 500 });

  const force = req.nextUrl.searchParams.get("force") === "1";
  if (!force && !isScheduledNow(await getSettings())) {
    return NextResponse.json({ skipped: true });
  }
  return NextResponse.json(await runAnalysis(apiKey));
}
