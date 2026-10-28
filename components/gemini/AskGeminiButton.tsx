"use client";
import { RiSparklingLine } from "@remixicon/react";


import { buttonClass } from "@/components/ui/Button";
import { openGemini } from "@/lib/openGemini";

export default function AskGeminiButton() {
  return (
    <button type="button" onClick={() => openGemini()} className={buttonClass("primary", "md")}>
      <RiSparklingLine className="h-4 w-4" />
      Pergunte ao Gemini
    </button>
  );
}
