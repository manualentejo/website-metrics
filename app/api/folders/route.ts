import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isOwner } from "@/lib/auth";
import { db } from "@/db/client";
import { folders } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name } = (await req.json()) as { name: string };
  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
  }

  const [folder] = await db.insert(folders).values({ name: name.trim() }).returning();
  return NextResponse.json(folder);
}
