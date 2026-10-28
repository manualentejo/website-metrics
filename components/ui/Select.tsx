import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
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
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}
