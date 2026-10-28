import type { ReactNode } from "react";
import * as AlignBadge from "@/components/align/badge";

type Tone = "neutral" | "success" | "warning" | "destructive" | "info";

const COLOR = { neutral: "gray", success: "green", warning: "orange", destructive: "red", info: "blue" } as const;

export default function Badge({
  tone = "neutral",
  dot = false,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <AlignBadge.Root variant="light" color={COLOR[tone]} size="medium" className="whitespace-nowrap">
      {dot && <AlignBadge.Dot />}
      {children}
    </AlignBadge.Root>
  );
}
