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
    return <span aria-label="Atenção" className="inline-block h-2.5 w-2.5 flex-shrink-0 bg-warning/100" />;
  }
  if (status === "pass") {
    return <span aria-label="Aprovado" className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full bg-success/100" />;
  }
  return (
    <span aria-label="Informativo" className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-border" />
  );
}

const VALUE_COLOR: Record<AuditStatus, string> = {
  fail: "text-destructive",
  average: "text-warning",
  pass: "text-success",
  info: "text-muted-foreground",
  manual: "text-muted-foreground",
  na: "text-muted-foreground",
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
        <a key={match.index} href={match[2]} target="_blank" rel="noreferrer" className="text-foreground underline underline-offset-2 hover:text-foreground">
          {match[1]}
        </a>
      );
    } else {
      parts.push(
        <code key={match.index} className="rounded bg-secondary px-1 py-0.5 font-mono text-[11px] text-foreground/80">
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
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-secondary"
      >
        <StatusIcon status={status} />
        <span className="flex-1 text-sm text-foreground">
          <RichText text={audit.title} />
          {audit.displayValue && (
            <span className={`ml-1.5 ${VALUE_COLOR[status]}`}>— {audit.displayValue}</span>
          )}
        </span>
        <RiArrowDownSLine className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="space-y-3 px-6 pb-5 pl-12">
          {plain && (
            <p className="text-sm leading-relaxed text-foreground/80">
              <span className="font-medium text-foreground">Em resumo: </span>
              {plain}
            </p>
          )}
          {audit.description && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              <RichText text={audit.description} />
            </p>
          )}

          {details && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary text-muted-foreground">
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
                    <tr key={i} className="border-t border-border">
                      {details.headings.map((h) => (
                        <td
                          key={h.key}
                          className={`px-3 py-2 align-top text-foreground/80 ${
                            h.valueType === "url" || h.valueType === "node" || h.valueType === "code"
                              ? "max-w-xs break-all font-mono text-[11px]"
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
                <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
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
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-foreground/80 ring-1 ring-border transition-colors hover:bg-secondary"
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
