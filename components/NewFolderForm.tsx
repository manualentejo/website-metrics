"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewFolderForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleCreate() {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      setName("");
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        + Nova pasta
      </button>
    );
  }

  return (
    <div className="flex gap-1 px-1">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreate();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Nome da pasta"
        className="min-w-0 flex-1 rounded-md border border-surface-border px-2 py-1 text-xs outline-none focus:border-slate-400"
      />
      <button
        onClick={handleCreate}
        disabled={saving}
        className="rounded-md bg-slate-900 px-2 text-xs font-medium text-white disabled:opacity-50"
      >
        OK
      </button>
    </div>
  );
}
