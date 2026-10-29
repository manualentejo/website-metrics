import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { sites } from "@/db/schema";
import { getViewer } from "@/lib/access";
import { runGeoAudit } from "@/lib/geoAudit";
import { addPrompts, getGeo, removePrompt, runGeoCheck, saveSettings, suggestPrompts } from "@/lib/geo";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Gerencia e roda a verificação de visibilidade em IA de um site. Só o dono.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer?.owner) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const { id } = await params;
  const [site] = await db.select().from(sites).where(eq(sites.id, id));
  if (!site) return NextResponse.json({ error: "Site não encontrado." }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    brand?: string;
    description?: string;
    competitors?: string[];
    prompt?: string;
    promptId?: string;
  };

  try {
    switch (body.action) {
      case "settings": {
        if (!body.brand?.trim()) return NextResponse.json({ error: "Informe o nome da marca." }, { status: 400 });
        await saveSettings(id, { brand: body.brand, description: body.description ?? "", competitors: body.competitors ?? [] });
        return NextResponse.json({ ok: true });
      }
      case "addPrompt": {
        await addPrompts(id, [body.prompt ?? ""]);
        return NextResponse.json({ ok: true });
      }
      case "removePrompt": {
        if (body.promptId) await removePrompt(id, body.promptId);
        return NextResponse.json({ ok: true });
      }
      case "suggest": {
        const geo = await getGeo(id, site.name);
        const list = await suggestPrompts(geo.settings.brand, site.url.replace(/^https?:\/\//, ""), geo.settings.description);
        await addPrompts(id, list);
        return NextResponse.json({ ok: true, added: list.length });
      }
      case "audit": {
        const r = await runGeoAudit(id, site.url);
        return NextResponse.json({ ok: true, score: r.score });
      }
      case "run": {
        const r = await runGeoCheck(id, site.url);
        return NextResponse.json({ ok: true, ...r });
      }
      default:
        return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
