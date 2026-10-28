import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/access";
import { buildReportPdf, hasReportFor, todayBrt } from "@/lib/reportPdf";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > todayBrt()) {
    return NextResponse.json({ error: "Data inválida." }, { status: 400 });
  }
  if (!(await hasReportFor(viewer, date))) {
    return NextResponse.json({ error: "Não há análises nessa semana." }, { status: 404 });
  }
  const bytes = await buildReportPdf(viewer, date);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="relatorio-${date}.pdf"`,
    },
  });
}
