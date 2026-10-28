import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { eq, inArray } from "drizzle-orm";
import { authOptions, isOwner } from "@/lib/auth";
import { db } from "@/db/client";
import { folders, sites } from "@/db/schema";

export const dynamic = "force-dynamic";

async function guard() {
  const session = await getServerSession(authOptions);
  return isOwner(session?.user?.email) ? null : NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}

const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

// Cria o workspace (grupo) e já coloca nele os sites escolhidos.
export async function POST(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const { name, siteIds } = (await req.json()) as { name?: string; siteIds?: string[] };
  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: "Dê um nome ao workspace." }, { status: 400 });
  }
  const [folder] = await db.insert(folders).values({ name: name.trim().slice(0, 60) }).returning();
  const toAdd = ids(siteIds);
  if (toAdd.length) await db.update(sites).set({ folderId: folder.id }).where(inArray(sites.id, toAdd));
  return NextResponse.json(folder);
}

// Renomeia e/ou move sites para dentro (addSiteIds) ou para fora (removeSiteIds) do workspace.
export async function PATCH(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;

  const b = (await req.json()) as { id?: string; name?: string; addSiteIds?: string[]; removeSiteIds?: string[] };
  if (!b.id) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  if (b.name !== undefined) {
    if (!b.name.trim()) return NextResponse.json({ error: "Dê um nome ao workspace." }, { status: 400 });
    await db.update(folders).set({ name: b.name.trim().slice(0, 60) }).where(eq(folders.id, b.id));
  }
  const add = ids(b.addSiteIds);
  if (add.length) await db.update(sites).set({ folderId: b.id }).where(inArray(sites.id, add));
  const remove = ids(b.removeSiteIds);
  if (remove.length) await db.update(sites).set({ folderId: null }).where(inArray(sites.id, remove));
  return NextResponse.json({ ok: true });
}

// Exclui só o grupo: os sites continuam no painel, em "Sem workspace".
export async function DELETE(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  await db.delete(folders).where(eq(folders.id, id));
  return NextResponse.json({ ok: true });
}
