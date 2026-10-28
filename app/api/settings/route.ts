import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isOwner } from "@/lib/auth";
import { getSettings, saveSettings } from "@/lib/settings";
import { runAnalysis } from "@/lib/runAnalysis";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function owner() {
  return isOwner((await getServerSession(authOptions))?.user?.email);
}

export async function PATCH(req: NextRequest) {
  if (!(await owner())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const b = (await req.json()) as { enabled?: boolean; weekday?: number; hour?: number };
  const patch: Record<string, unknown> = {};
  if (typeof b.enabled === "boolean") patch.enabled = b.enabled;
  if (Number.isInteger(b.weekday) && b.weekday! >= 0 && b.weekday! <= 6) patch.weekday = b.weekday;
  if (Number.isInteger(b.hour) && b.hour! >= 0 && b.hour! <= 23) patch.hour = b.hour;
  return NextResponse.json(await saveSettings(patch));
}

/** "Analisar agora": roda a análise de todos os sites imediatamente. */
export async function POST() {
  if (!(await owner())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "PAGESPEED_API_KEY not configured" }, { status: 500 });
  return NextResponse.json(await runAnalysis(apiKey));
}
