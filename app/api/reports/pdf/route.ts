import { NextRequest, NextResponse } from "next/server";
import { getViewer, type Viewer } from "@/lib/access";
import { isOwner } from "@/lib/auth";
import { buildReportPdf, hasReportFor, todayBrt } from "@/lib/reportPdf";
import { readShareToken } from "@/lib/shareToken";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? "";
  const token = req.nextUrl.searchParams.get("t");

  // Com link assinado, abre sem login, como a pessoa que gerou o link.
  let viewer: Viewer | null = null;
  if (token) {
    const email = readShareToken(token, date);
    if (!email) return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 403 });
    viewer = { email, owner: isOwner(email) };
  } else {
    viewer = await getViewer();
  }
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      "Content-Disposition": `${token ? "inline" : "attachment"}; filename="relatorio-${date}.pdf"`,
    },
  });
}
