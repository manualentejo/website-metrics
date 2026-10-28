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
    <div className="rounded-2xl border border-stroke-soft-200 bg-surface-raised p-6">
      <h3 className="text-sm font-semibold text-text-strong-950/80">Compartilhamento e organização</h3>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-paragraph-xs text-text-sub-600">Visibilidade</label>
          <select
            value={vis}
            disabled={saving}
            onChange={(e) => handleVisibilityChange(e.target.value as "private" | "shared")}
            className="mt-1 h-9 rounded-md border border-stroke-soft-200 bg-bg-white-0 px-3 text-sm shadow-sm"
          >
            <option value="private">Privado (só eu)</option>
            <option value="shared">Compartilhado</option>
          </select>
        </div>

        <div>
          <label className="block text-paragraph-xs text-text-sub-600">Workspace</label>
          <select
            value={folderId}
            disabled={saving}
            onChange={(e) => handleFolderChange(e.target.value)}
            className="mt-1 h-9 rounded-md border border-stroke-soft-200 bg-bg-white-0 px-3 text-sm shadow-sm"
          >
            <option value="">Sem workspace</option>
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
          <label className="block text-paragraph-xs text-text-sub-600">
            E-mails com acesso (precisam entrar com essa conta Google)
          </label>
          <div className="mt-2 flex gap-2">
            <input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEmail()}
              placeholder="nome@exemplo.com"
              className="flex-1 h-9 rounded-md border border-stroke-soft-200 bg-bg-white-0 px-3 text-sm shadow-sm outline-none focus:border-ring"
            />
            <button
              onClick={addEmail}
              disabled={saving}
              className="h-9 rounded-md bg-bg-strong-950 px-4 text-sm font-medium text-text-white-0 disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
          <ul className="mt-3 space-y-1">
            {emails.map((email) => (
              <li key={email} className="flex items-center justify-between rounded-md bg-bg-weak-50 px-3 py-1.5 text-sm">
                <span className="text-text-strong-950/80">{email}</span>
                <button onClick={() => removeEmail(email)} className="text-paragraph-xs text-text-sub-600 hover:text-error-base">
                  remover
                </button>
              </li>
            ))}
            {emails.length === 0 && <li className="text-paragraph-xs text-text-sub-600">Nenhum e-mail adicionado ainda.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
