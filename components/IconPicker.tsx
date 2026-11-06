"use client";

import { ICONS } from "@/components/WorkspaceIcon";
import { WORKSPACE_ICON_IDS } from "@/lib/workspaceIcons";

/** Grade para escolher o ícone do workspace. */
export default function IconPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Ícone do workspace" className="grid grid-cols-8 gap-1.5 sm:grid-cols-9">
      {WORKSPACE_ICON_IDS.map((id) => {
        const { Icon, label } = ICONS[id];
        const on = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={label}
            title={label}
            onClick={() => onChange(id)}
            className={`flex size-9 items-center justify-center rounded-lg transition duration-150 ${
              on ? "bg-bg-strong-950 text-text-white-0" : "bg-bg-weak-50 text-text-sub-600 hover:bg-bg-soft-200 hover:text-text-strong-950"
            }`}
          >
            <Icon className="size-5" />
          </button>
        );
      })}
    </div>
  );
}
