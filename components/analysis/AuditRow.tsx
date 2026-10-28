"use client";
import { RiArrowDownSLine, RiSparklingLine } from "@remixicon/react";

import { useState } from "react";

import type { AuditStatus, StoredAudit } from "@/lib/analysis";
import { auditStatus } from "@/lib/analysis";
import { AUDIT_PLAIN } from "@/lib/glossary";
import { formatCell } from "@/lib/format";
import { openGemini } from "@/lib/openGemini";

export function StatusIcon({ status }: { status: AuditStatus }) {
  if (status === "fail") {
    return (
      <svg viewBox="0 0 12 12" className="h-3 w-3 flex-shrink-0" aria-label="Crítico">
        <path d="M6 1 11.5 11H.5z" fill="#e11d48" />
      </svg>
    );
  }
  if (status === "average") {
    return <span aria-label="Atenção" className="inline-block h-2.5 w-2.5 flex-shrink-0 bg-warning-base/100" />;
  }
  if (status === "pass") {
    return <span aria-label="Aprovado" className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-success-base/100" />;
  }
  return (
    <span aria-label="Informativo" className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-stroke-soft-200" />
  );
}

const VALUE_COLOR: Record<AuditStatus, string> = {
  fail: "text-error-base",
  average: "text-warning-base",
  pass: "text-success-base",
  info: "text-text-sub-600",
  manual: "text-text-sub-600",
  na: "text-text-sub-600",
};

/** Renderiza os links em markdown [texto](url) e `código` das descrições do Lighthouse. */
function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1]) {
      parts.push(
        <a key={match.index} href={match[2]} target="_blank" rel="noreferrer" className="text-text-strong-950 underline underline-offset-2 hover:text-text-strong-950">
          {match[1]}
        </a>
      );
    } else {
      parts.push(
        <code key={match.index} className="rounded bg-bg-weak-50 px-1 py-0.5 font-mono text-paragraph-xs text-text-strong-950/80">
          {match[3]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export default function AuditRow({
  id,
  audit,
  siteName,
  strategyLabel,
}: {
  id: string;
  audit: StoredAudit;
  siteName: string;
  strategyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const status = auditStatus(audit);
  const plain = AUDIT_PLAIN[id];
  const details = audit.details;

  return (
    <li className="border-b border-stroke-soft-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-bg-weak-50"
      >
        <StatusIcon status={status} />
        <span className="flex-1 text-sm text-text-strong-950">
          <RichText text={audit.title} />
          {audit.displayValue && (
            <span className={`ml-1.5 ${VALUE_COLOR[status]}`}>— {audit.displayValue}</span>
          )}
        </span>
        <RiArrowDownSLine className={`h-4 w-4 flex-shrink-0 text-text-sub-600 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-3 px-6 pb-5 pl-12">
          {plain && (
            <p className="text-sm leading-relaxed text-text-strong-950/80">
              <span className="font-medium text-text-strong-950">Em resumo: </span>
              {plain}
            </p>
          )}
          {audit.description && (
            <p className="text-paragraph-xs leading-relaxed text-text-sub-600">
              <RichText text={audit.description} />
            </p>
          )}

          {details && (
            <div className="overflow-x-auto rounded-lg border border-stroke-soft-200">
              <table className="w-full text-left text-paragraph-xs">
                <thead className="bg-bg-weak-50 text-text-sub-600">
                  <tr>
                    {details.headings.map((h) => (
                      <th key={h.key} className="whitespace-nowrap px-3 py-2 font-medium">
                        {h.label || (h.valueType === "node" ? "Elemento" : "")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {details.items.map((row, i) => (
                    <tr key={i} className="border-t border-stroke-soft-200">
                      {details.headings.map((h) => (
                        <td
                          key={h.key}
                          className={`px-3 py-2 align-top text-text-strong-950/80 ${
                            h.valueType === "url" || h.valueType === "node" || h.valueType === "code"
                              ? "max-w-xs break-all font-mono text-paragraph-xs"
                              : "whitespace-nowrap"
                          }`}
                        >
                          {formatCell(row[h.key], h.valueType)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {details.totalItems > details.items.length && (
                <p className="border-t border-stroke-soft-200 px-3 py-2 text-paragraph-xs text-text-sub-600">
                  + {details.totalItems - details.items.length} itens não exibidos
                </p>
              )}
            </div>
          )}

          {status !== "pass" && status !== "na" && (
            <button
              type="button"
              onClick={() =>
                openGemini(
                  `No site ${siteName} (análise ${strategyLabel}), o Lighthouse apontou: "${audit.title}"${
                    audit.displayValue ? ` (${audit.displayValue})` : ""
                  }. Explique em linguagem simples o que isso significa e como corrigir no Framer, passo a passo.`
                )
              }
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-paragraph-xs font-medium text-text-strong-950/80 ring-1 ring-border transition-colors hover:bg-bg-weak-50"
            >
              <RiSparklingLine className="h-3.5 w-3.5" />
              Como corrigir no Framer?
            </button>
          )}
        </div>
      )}
    </li>
  );
}
