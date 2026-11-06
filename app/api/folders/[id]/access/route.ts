import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/access";
import { addFolderAccess, listFolderAccess, removeFolderAccess } from "@/lib/folderAccess";

export const dynamic = "force-dynamic";

async function guard() {
  const viewer = await getViewer();
  return viewer?.owner ? null : NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}

// Lista, concede e remove o acesso de uma pessoa a um workspace inteiro. Só o dono.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  return NextResponse.json({ emails: await listFolderAccess(id) });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const { email } = (await req.json()) as { email?: string };
  if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  await addFolderAccess(id, email);
  return NextResponse.json({ emails: await listFolderAccess(id) });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  const { id } = await params;
  const { email } = (await req.json()) as { email?: string };
  if (email) await removeFolderAccess(id, email);
  return NextResponse.json({ emails: await listFolderAccess(id) });
}
