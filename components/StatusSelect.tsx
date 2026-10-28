"use client";
import { RiArrowDownSLine } from "@remixicon/react";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Status } from "@/lib/types";

const LABEL: Record<Status, string> = { no_ar: "No ar", em_andamento: "Em andamento" };
const DOT: Record<Status, string> = { no_ar: "bg-success", em_andamento: "bg-warning" };

export default function StatusSelect({
  siteId,
  status,
  readOnly,
}: {
  siteId: string;
  status: Status;
  readOnly?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(status);
  const router = useRouter();

  async function handleChange(next: Status) {
    setSaving(true);
    setCurrent(next);
    try {
      await fetch("/api/sites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: siteId, status: next }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  // Mesmo tamanho do Button sm: 32px de altura, 136px de largura, canto 6px.
  const base = "inline-flex h-8 w-[136px] items-center gap-2 rounded-md border border-input bg-card pl-2.5 text-xs font-medium text-foreground shadow-sm";
  const dot = <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${DOT[current]}`} />;

  if (readOnly) {
    return (
      <span className={base}>
        {dot}
        {LABEL[current]}
      </span>
    );
  }

  return (
    <label className={`relative ${base} focus-within:ring-2 focus-within:ring-ring/15`}>
      {dot}
      <select
        value={current}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value as Status)}
        aria-label="Status do site"
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-md bg-transparent pl-7 pr-7 text-xs outline-none"
      >
        <option value="no_ar">{LABEL.no_ar}</option>
        <option value="em_andamento">{LABEL.em_andamento}</option>
      </select>
      <RiArrowDownSLine className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
    </label>
  );
}
