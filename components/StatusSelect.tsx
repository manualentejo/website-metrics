"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Status } from "@/lib/types";

const STATUS_LABEL: Record<Status, string> = {
  no_ar: "No ar",
  em_andamento: "Em andamento",
};

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

  if (readOnly) {
    return (
      <span
        className={`rounded-lg border border-surface-border px-3 py-1.5 text-sm font-medium ${
          current === "no_ar" ? "text-emerald-600" : "text-amber-600"
        }`}
      >
        {STATUS_LABEL[current]}
      </span>
    );
  }

  return (
    <select
      value={current}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as Status)}
      className={`rounded-lg border border-surface-border bg-white px-3 py-1.5 text-sm font-medium outline-none ${
        current === "no_ar" ? "text-emerald-600" : "text-amber-600"
      }`}
    >
      <option value="no_ar">{STATUS_LABEL.no_ar}</option>
      <option value="em_andamento">{STATUS_LABEL.em_andamento}</option>
    </select>
  );
}
