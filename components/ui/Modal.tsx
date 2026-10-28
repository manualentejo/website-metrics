"use client";

import type { ReactNode } from "react";
import * as AlignModal from "@/components/align/modal";

// Diálogo do AlignUI (Radix Dialog): foco preso, Esc e clique fora fecham.
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <AlignModal.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AlignModal.Content className="max-w-md">
        <AlignModal.Header title={title} description={description} />
        <AlignModal.Body>{children}</AlignModal.Body>
        {footer && <AlignModal.Footer className="justify-end gap-2">{footer}</AlignModal.Footer>}
      </AlignModal.Content>
    </AlignModal.Root>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-label-sm text-text-strong-950">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-paragraph-xs text-text-sub-600">{hint}</span>}
    </label>
  );
}
