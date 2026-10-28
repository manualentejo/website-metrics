"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { Status } from "@/lib/types";

const LABEL: Record<Status, string> = { no_ar: "No ar", em_andamento: "Em andamento" };
const TONE: Record<Status, string> = {
  no_ar: "text-success",
  em_andamento: "text-warning",
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

  const base = `inline-flex h-8 w-[132px] items-center rounded-full border border-input bg-card text-xs font-medium shadow-sm ${TONE[current]}`;
  const dot = <span className="ml-3 mr-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-current" />;

  if (readOnly) {
    return (
      <span className={base}>
        {dot}
        {LABEL[current]}
      </span>
    );
  }

  return (
    <label className={`relative ${base} focus-within:ring-2 focus-within:ring-ring/20`}>
      {dot}
      <select
        value={current}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value as Status)}
        aria-label="Status do site"
        className="h-full w-full cursor-pointer appearance-none bg-transparent pr-7 outline-none"
      >
        <option value="no_ar">{LABEL.no_ar}</option>
        <option value="em_andamento">{LABEL.em_andamento}</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-muted-foreground" />
    </label>
  );
}
