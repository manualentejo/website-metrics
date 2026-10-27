"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SharingPanel({
  siteId,
  visibility,
  initialEmails,
  folders,
  currentFolderId,
}: {
  siteId: string;
  visibility: "private" | "shared";
  initialEmails: string[];
  folders: { id: string; name: string }[];
  currentFolderId: string | null;
}) {
  const [vis, setVis] = useState(visibility);
  const [emails, setEmails] = useState(initialEmails);
  const [newEmail, setNewEmail] = useState("");
  const [folderId, setFolderId] = useState(currentFolderId ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function updateSite(payload: Record<string, unknown>) {
    setSaving(true);
    try {
      await fetch("/api/sites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: siteId, ...payload }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleVisibilityChange(next: "private" | "shared") {
    setVis(next);
    await updateSite({ visibility: next });
  }

  async function handleFolderChange(next: string) {
    setFolderId(next);
    await updateSite({ folderId: next || null });
  }

  async function addEmail() {
    const email = newEmail.trim();
    if (!email || !email.includes("@")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const rows = await res.json();
      setEmails(rows.map((r: { email: string }) => r.email));
      setNewEmail("");
    } finally {
      setSaving(false);
    }
  }

  async function removeEmail(email: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/access`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const rows = await res.json();
      setEmails(rows.map((r: { email: string }) => r.email));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
      <h3 className="text-sm font-semibold text-slate-700">Compartilhamento e organização</h3>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs text-slate-500">Visibilidade</label>
          <select
            value={vis}
            disabled={saving}
            onChange={(e) => handleVisibilityChange(e.target.value as "private" | "shared")}
            className="mt-1 rounded-lg border border-surface-border bg-white px-3 py-1.5 text-sm"
          >
            <option value="private">Privado (só eu)</option>
            <option value="shared">Compartilhado</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500">Pasta</label>
          <select
            value={folderId}
            disabled={saving}
            onChange={(e) => handleFolderChange(e.target.value)}
            className="mt-1 rounded-lg border border-surface-border bg-white px-3 py-1.5 text-sm"
          >
            <option value="">Sem pasta</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {vis === "shared" && (
        <div className="mt-5">
          <label className="block text-xs text-slate-500">
            E-mails com acesso (precisam entrar com essa conta Google)
          </label>
          <div className="mt-2 flex gap-2">
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEmail()}
              placeholder="nome@exemplo.com"
              className="flex-1 rounded-lg border border-surface-border bg-white px-3 py-1.5 text-sm outline-none focus:border-slate-400"
            />
            <button
              onClick={addEmail}
              disabled={saving}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
          <ul className="mt-3 space-y-1">
            {emails.map((email) => (
              <li key={email} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-sm">
                <span className="text-slate-700">{email}</span>
                <button onClick={() => removeEmail(email)} className="text-xs text-slate-400 hover:text-rose-600">
                  remover
                </button>
              </li>
            ))}
            {emails.length === 0 && <li className="text-xs text-slate-400">Nenhum e-mail adicionado ainda.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
