"use client";
import { RiCheckLine, RiFileCopyLine } from "@remixicon/react";

import { useState } from "react";

import Button from "@/components/ui/Button";

export default function CopyBox({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-secondary p-2.5">
      <code className="min-w-0 flex-1 break-all text-xs text-foreground">{text}</code>
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setDone(true);
            setTimeout(() => setDone(false), 2000);
          } catch {}
        }}
      >
        {done ? <RiCheckLine className="h-3.5 w-3.5" /> : <RiFileCopyLine className="h-3.5 w-3.5" />}
        {done ? "Copiado" : "Copiar"}
      </Button>
    </div>
  );
}
