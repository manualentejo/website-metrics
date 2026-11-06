"use client";

import Link from "next/link";
import { useState } from "react";
import { RiArrowRightLine } from "@remixicon/react";
import Badge from "@/components/ui/Badge";
import SiteIcon from "@/components/SiteIcon";
import { inputClass } from "@/components/ui/fields";

type State = "todo" | "doing" | "done";

const LABEL: Record<State, string> = { todo: "A fazer", doing: "Em andamento", done: "Feito" };

export interface TaskView {
  key: string;
  siteId: string;
  siteName: string;
  siteUrl: string;
  tab: string;
  title: string;
  detail: string | null;
  plain: string | null;
  severity: "critical" | "warning";
  href: string;
  status: State;
  assignee: string | null;
}

/** Uma tarefa da fila: abre a análise do site, e o status e o responsável são salvos na hora. */
export default function TaskRow({ task, index, people, canEdit }: { task: TaskView; index: number; people: string[]; canEdit: boolean }) {
  const [status, setStatus] = useState<State>(task.status);
  const [assignee, setAssignee] = useState(task.assignee ?? "");
  const [error, setError] = useState(false);

  async function save(patch: { status?: State; assignee?: string | null }) {
    setError(false);
    const res = await fetch("/api/fixes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: task.key, siteId: task.siteId, ...patch }),
    });
    if (!res.ok) setError(true);
  }

  const done = status === "done";
  const sev = task.severity === "critical" ? { tone: "destructive" as const, label: "Crítico" } : { tone: "warning" as const, label: "Atenção" };

  return (
    <li className={`flex flex-wrap items-start gap-x-4 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-5 ${done ? "opacity-60" : ""}`}>
      <span className="w-5 flex-shrink-0 pt-0.5 text-paragraph-xs tabular-nums text-text-soft-400">{index}</span>
      <div className="min-w-0 flex-1">
        <Link href={task.href} className="group inline-flex max-w-full items-center gap-1.5 text-label-md text-text-strong-950 hover:underline">
          <span className={`truncate ${done ? "line-through" : ""}`}>{task.title}</span>
          <RiArrowRightLine className="size-3.5 flex-shrink-0 text-text-soft-400 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-paragraph-xs text-text-sub-600">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-bg-weak-50 py-0.5 pl-1 pr-2 text-label-xs text-text-strong-950">
            <SiteIcon url={task.siteUrl} name={task.siteName} size={16} />
            {task.siteName}
          </span>
          {task.detail && <span>{task.detail}</span>}
        </p>
        {task.plain && <p className="mt-1 text-paragraph-xs text-text-sub-600">{task.plain}</p>}
      </div>
      <div className="flex flex-shrink-0 flex-wrap items-center gap-2 pl-8 sm:pl-0">
        <Badge tone={sev.tone}>{sev.label}</Badge>
        <select
          aria-label="Status da tarefa"
          value={status}
          disabled={!canEdit}
          onChange={(e) => {
            const v = e.target.value as State;
            setStatus(v);
            void save({ status: v });
          }}
          className={`${inputClass} h-8 w-[8.5rem] py-0 text-paragraph-xs`}
        >
          {(Object.keys(LABEL) as State[]).map((s) => (
            <option key={s} value={s}>
              {LABEL[s]}
            </option>
          ))}
        </select>
        <input
          aria-label="Responsável"
          list="task-people"
          value={assignee}
          disabled={!canEdit}
          maxLength={40}
          placeholder="Responsável"
          onChange={(e) => setAssignee(e.target.value)}
          onBlur={() => {
            if (assignee.trim() !== (task.assignee ?? "")) void save({ assignee: assignee.trim() || null });
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className={`${inputClass} h-8 w-32 py-0 text-paragraph-xs`}
        />
        {error && <span role="alert" className="text-paragraph-xs text-error-base">Não salvou</span>}
      </div>
      {index === 1 && (
        <datalist id="task-people">
          {people.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      )}
    </li>
  );
}
