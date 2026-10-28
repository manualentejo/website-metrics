"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { inputClass } from "@/components/ui/fields";

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
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Novo workspace
      </button>
    );
  }

  return (
    <div className="px-1">
      <input
        autoFocus
        value={name}
        disabled={saving}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => !name && setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCreate();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Nome e Enter"
        className={`${inputClass} h-8 w-full text-xs`}
      />
    </div>
  );
}
