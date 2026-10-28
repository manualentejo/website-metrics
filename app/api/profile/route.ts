import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

const MAX_IMAGE = 400_000; // caracteres do data URL (~300 KB)

export async function PATCH(req: NextRequest) {
  const email = (await getServerSession(authOptions))?.user?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const b = (await req.json()) as { name?: string | null; role?: string | null; image?: string | null };
  const patch: Record<string, string | null> = {};
  if (b.name !== undefined) patch.name = b.name ? String(b.name).trim().slice(0, 80) || null : null;
  if (b.role !== undefined) patch.role = b.role ? String(b.role).trim().slice(0, 80) || null : null;
  if (b.image !== undefined) {
    if (b.image === null) patch.image = null;
    else if (typeof b.image === "string" && b.image.startsWith("data:image/") && b.image.length <= MAX_IMAGE) patch.image = b.image;
    else return NextResponse.json({ error: "Imagem inválida ou grande demais." }, { status: 400 });
  }
  return NextResponse.json(await saveProfile(email, patch));
}
