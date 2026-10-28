import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isOwner } from "@/lib/auth";
import { db } from "@/db/client";
import { sites, reports } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const allSites = await db.select().from(sites).orderBy(asc(sites.sortOrder));

  const withLatest = await Promise.all(
    allSites.map(async (site) => {
      const latest = await db
        .select()
        .from(reports)
        .where(eq(reports.siteId, site.id))
        .orderBy(desc(reports.ranAt))
        .limit(10);
      return { ...site, latestReports: latest };
    })
  );

  return NextResponse.json(withLatest);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { url, folderId } = (await req.json()) as { url?: string; folderId?: string | null };
  let parsed: URL;
  try {
    parsed = new URL(/^https?:\/\//i.test(url ?? "") ? url! : `https://${url}`);
    if (!parsed.hostname.includes(".")) throw new Error();
  } catch {
    return NextResponse.json({ error: "Endereço inválido." }, { status: 400 });
  }
  const normalized = `${parsed.origin}/`;
  const existing = await db.select().from(sites).where(eq(sites.url, normalized));
  if (existing.length) return NextResponse.json({ error: "Esse site já está no painel." }, { status: 409 });

  const host = parsed.hostname.replace(/^www\./, "");
  const name = host.split(".")[0].replace(/^./, (c) => c.toUpperCase());
  const all = await db.select().from(sites);
  const [site] = await db
    .insert(sites)
    .values({ name, url: normalized, folderId: folderId || null, sortOrder: all.length + 1 })
    .returning();
  return NextResponse.json(site);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { id, status, visibility, folderId } = body as {
    id: string;
    status?: string;
    visibility?: string;
    folderId?: string | null;
  };

  if (!id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (status) {
    if (!["no_ar", "em_andamento"].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    update.status = status;
  }
  if (visibility) {
    if (!["private", "shared"].includes(visibility)) {
      return NextResponse.json({ error: "Visibilidade inválida" }, { status: 400 });
    }
    update.visibility = visibility;
  }
  if (folderId !== undefined) {
    update.folderId = folderId;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  await db.update(sites).set(update).where(eq(sites.id, id));
  return NextResponse.json({ ok: true });
}
