import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isOwner } from "@/lib/auth";
import { db } from "@/db/client";
import { siteAccess } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function requireOwner() {
  const session = await getServerSession(authOptions);
  return isOwner(session?.user?.email);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const rows = await db.select().from(siteAccess).where(eq(siteAccess.siteId, id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const { email } = (await req.json()) as { email: string };
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  await db
    .insert(siteAccess)
    .values({ siteId: id, email: email.trim().toLowerCase() })
    .onConflictDoNothing();

  const rows = await db.select().from(siteAccess).where(eq(siteAccess.siteId, id));
  return NextResponse.json(rows);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireOwner())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const { email } = (await req.json()) as { email: string };

  await db.delete(siteAccess).where(and(eq(siteAccess.siteId, id), eq(siteAccess.email, email.toLowerCase())));

  const rows = await db.select().from(siteAccess).where(eq(siteAccess.siteId, id));
  return NextResponse.json(rows);
}
