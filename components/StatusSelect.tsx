"use client";
import { RiArrowDownSLine } from "@remixicon/react";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Status } from "@/lib/types";

const LABEL: Record<Status, string> = { no_ar: "No ar", em_andamento: "Em andamento" };
const DOT: Record<Status, string> = { no_ar: "bg-success-base", em_andamento: "bg-warning-base" };

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
  const base = "inline-flex h-8 w-[144px] items-center gap-2 rounded-lg bg-bg-white-0 pl-2.5 text-label-xs text-text-strong-950 shadow-regular-xs ring-1 ring-inset ring-stroke-soft-200";
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
    <label className={`relative ${base} transition duration-200 hover:bg-bg-weak-50 focus-within:shadow-button-important-focus focus-within:ring-stroke-strong-950`}>
      {dot}
      <select
        value={current}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value as Status)}
        aria-label="Status do site"
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-lg bg-transparent pl-7 pr-7 text-label-xs outline-none"
      >
        <option value="no_ar">{LABEL.no_ar}</option>
        <option value="em_andamento">{LABEL.em_andamento}</option>
      </select>
      <RiArrowDownSLine className="pointer-events-none absolute right-2 size-4 text-text-sub-600" />
    </label>
  );
}
