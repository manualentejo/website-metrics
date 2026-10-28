import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isOwner } from "@/lib/auth";
import { db } from "@/db/client";
import { sites, reports } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { analyzeSite } from "@/lib/runAnalysis";
import { nameFromHost, normalizeSiteUrl } from "@/lib/url";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
  const n = normalizeSiteUrl(url);
  if (!n) return NextResponse.json({ error: "Endereço inválido." }, { status: 400 });
  const normalized = n.url;
  const existing = await db.select().from(sites).where(eq(sites.url, normalized));
  if (existing.length) return NextResponse.json({ error: "Esse site já está no painel." }, { status: 409 });

  const name = nameFromHost(n.host);
  const all = await db.select().from(sites);
  const [site] = await db
    .insert(sites)
    .values({ name, url: normalized, folderId: folderId || null, sortOrder: all.length + 1 })
    .returning();

  // Analisa na hora (computador e celular) para o site já entrar com notas.
  const apiKey = process.env.PAGESPEED_API_KEY;
  const results = apiKey ? await analyzeSite(site, apiKey) : [];
  return NextResponse.json({ ...site, analysis: results });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { id, status, visibility, folderId, name, url } = body as {
    id: string;
    name?: string;
    url?: string;
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
  if (name !== undefined) {
    const trimmed = name.trim().slice(0, 80);
    if (!trimmed) return NextResponse.json({ error: "Dê um nome ao site." }, { status: 400 });
    update.name = trimmed;
  }
  let urlChanged = false;
  if (url !== undefined) {
    const n = normalizeSiteUrl(url);
    if (!n) return NextResponse.json({ error: "Endereço inválido." }, { status: 400 });
    const clash = await db.select().from(sites).where(eq(sites.url, n.url));
    if (clash.some((c) => c.id !== id)) return NextResponse.json({ error: "Esse endereço já está em outro site." }, { status: 409 });
    update.url = n.url;
    urlChanged = true;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const [site] = await db.update(sites).set(update).where(eq(sites.id, id)).returning();
  if (!site) return NextResponse.json({ error: "Site não encontrado." }, { status: 404 });

  // Endereço novo: analisa na hora para o site já aparecer com as notas do domínio novo.
  const apiKey = process.env.PAGESPEED_API_KEY;
  const analysis = urlChanged && apiKey ? await analyzeSite(site, apiKey) : [];
  return NextResponse.json({ ok: true, analysis });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isOwner(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  // Análises, instantâneos, acessos e visitas saem junto (ON DELETE CASCADE).
  await db.delete(sites).where(eq(sites.id, id));
  return NextResponse.json({ ok: true });
}
