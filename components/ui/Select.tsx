import { RiArrowDownSLine } from "@remixicon/react";
import type { SelectHTMLAttributes } from "react";

import { selectClass } from "./fields";

// Select nativo com a mesma altura, borda e seta de todos os outros controles.
export default function Select({
  className = "",
  wrapperClassName = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { wrapperClassName?: string }) {
  return (
    <div className={`relative inline-flex ${wrapperClassName}`}>
      <select className={`${selectClass} w-full ${className}`} {...props}>
        {children}
      </select>
      <RiArrowDownSLine className="pointer-events-none absolute right-2.5 top-1/2 size-5 -translate-y-1/2 text-text-sub-600" />
    </div>
  );
}
