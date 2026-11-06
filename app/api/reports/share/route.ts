import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/access";
import { hasReportFor, todayBrt } from "@/lib/reportPdf";
import { makeShareToken, shareAvailable, SHARE_DAYS } from "@/lib/shareToken";

export const dynamic = "force-dynamic";

// Gera um link do PDF do relatório que abre sem login e expira em alguns dias.
export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!shareAvailable()) return NextResponse.json({ error: "Compartilhamento indisponível (falta a chave de assinatura)." }, { status: 503 });
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayBrt()) return NextResponse.json({ error: "Data inválida." }, { status: 400 });
  if (!(await hasReportFor(viewer, date))) return NextResponse.json({ error: "Não há análises nessa semana." }, { status: 404 });
  const url = `${req.nextUrl.origin}/api/reports/pdf?date=${date}&t=${makeShareToken(viewer.email, date)}`;
  return NextResponse.json({ url, days: SHARE_DAYS });
}
