"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Upload } from "lucide-react";
import { signOut } from "next-auth/react";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/fields";

function Row({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-[1fr_340px] md:gap-8">
      <div>
        <p className="text-[13px] font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

// Reduz a foto para 256×256 no navegador antes de enviar (cabe fácil no banco).
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const side = 256;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = side;
      const ctx = canvas.getContext("2d")!;
      const min = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, side, side);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    img.src = url;
  });
}

export default function ProfileForm({
  email,
  initial,
}: {
  email: string;
  initial: { name: string; role: string; image: string | null };
}) {
  const [name, setName] = useState(initial.name);
  const [role, setRole] = useState(initial.role);
  const [image, setImage] = useState(initial.image);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const dirty = name !== initial.name || role !== initial.role || image !== initial.image;

  async function save() {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, image }),
    });
    setSaving(false);
    const data = await res.json().catch(() => null);
    setMsg(res.ok ? "Alterações salvas." : data?.error ?? "Não foi possível salvar.");
    if (res.ok) router.refresh();
  }

  async function pick(file: File | undefined) {
    if (!file) return;
    try {
      setImage(await resizeImage(file));
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <Row title="Nome" description="Como seu nome aparece na barra lateral.">
          <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} w-full`} maxLength={80} />
        </Row>
        <Row title="Cargo" description="Opcional. Aparece abaixo do seu nome.">
          <input value={role} onChange={(e) => setRole(e.target.value)} className={`${inputClass} w-full`} maxLength={80} placeholder="Ex.: Designer" />
        </Row>
        <Row title="Foto do perfil" description="PNG, JPG ou GIF. Recortamos em quadrado automaticamente.">
          <div className="flex items-center gap-4">
            <Avatar name={name || email} image={image} size={56} />
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-3.5 w-3.5" />
                Enviar foto
              </Button>
              {image && (
                <Button variant="ghost" size="sm" onClick={() => setImage(null)}>
                  Remover
                </Button>
              )}
            </div>
          </div>
        </Row>
        <Row title="E-mail" description="Vem da sua conta Google e não pode ser alterado aqui.">
          <input value={email} readOnly className={`${inputClass} w-full bg-secondary text-muted-foreground`} />
        </Row>
        <Row title="Sessão" description="Sai deste dispositivo. Você entra de novo com a conta Google.">
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="h-3.5 w-3.5" />
            Sair da conta
          </Button>
        </Row>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {msg && <p role="status" className="text-xs text-muted-foreground">{msg}</p>}
        <Button
          variant="outline"
          disabled={!dirty || saving}
          onClick={() => {
            setName(initial.name);
            setRole(initial.role);
            setImage(initial.image);
            setMsg(null);
          }}
        >
          Cancelar
        </Button>
        <Button disabled={!dirty || saving} onClick={save}>
          {saving ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </div>
  );
}
