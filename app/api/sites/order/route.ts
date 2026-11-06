import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sites } from "@/db/schema";
import { getViewer } from "@/lib/access";

export const dynamic = "force-dynamic";

// Salva a ordem dos sites dentro de um workspace (ou de "Sem workspace"). Só o dono.
export async function PATCH(req: NextRequest) {
  const viewer = await getViewer();
  if (!viewer?.owner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { ids } = (await req.json()) as { ids?: unknown };
  if (!Array.isArray(ids) || ids.some((x) => typeof x !== "string")) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  await Promise.all((ids as string[]).map((id, i) => db.update(sites).set({ sortOrder: i }).where(eq(sites.id, id))));
  return NextResponse.json({ ok: true });
}
