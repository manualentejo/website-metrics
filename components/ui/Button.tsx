import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type Size = "sm" | "md" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
  outline: "border border-input bg-card text-foreground hover:bg-accent shadow-sm",
  ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
  destructive: "bg-destructive text-white hover:bg-destructive/90 shadow-sm",
};

// Todos os controles do sistema usam 32px (sm/md) para alinhar lado a lado.
const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-3.5 text-[13px] gap-2",
  icon: "h-8 w-8",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}
