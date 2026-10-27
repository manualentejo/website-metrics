"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { StoredAudit } from "@/lib/analysis";
import InfoTip from "@/components/ui/InfoTip";
import AuditRow from "./AuditRow";

export default function AuditSection({
  title,
  description,
  infoTerm,
  infoText,
  items,
  siteName,
  strategyLabel,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  description?: string | null;
  infoTerm?: string;
  infoText?: string;
  items: { id: string; audit: StoredAudit }[];
  siteName: string;
  strategyLabel: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (items.length === 0) return null;

  const label = (
    <>
      {title}
      <span className="ml-1.5 font-normal text-slate-400">({items.length})</span>
    </>
  );
  const labelClass = "text-[11px] font-semibold uppercase tracking-wider text-slate-500";
  const info = (infoTerm || infoText) && (
    <InfoTip term={infoTerm} title={infoText ? title : undefined} text={infoText} align="start" />
  );

  return (
    <div className="border-t border-surface-border first:border-t-0">
      {collapsible ? (
        <div className="flex items-center gap-1.5 px-6 py-3 hover:bg-slate-50">
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`text-left ${labelClass}`}>
            {label}
          </button>
          {info}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"
          >
            {open ? "Ocultar" : "Mostrar"}
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      ) : (
        <div className={`flex items-center gap-1.5 px-6 pb-1 pt-4 ${labelClass}`}>
          <span>{label}</span>
          {info}
        </div>
      )}
      {description && open && !collapsible && <p className="px-6 pb-2 text-xs text-slate-400">{description}</p>}
      {open && (
        <ul>
          {items.map(({ id, audit }) => (
            <AuditRow key={id} id={id} audit={audit} siteName={siteName} strategyLabel={strategyLabel} />
          ))}
        </ul>
      )}
    </div>
  );
}
