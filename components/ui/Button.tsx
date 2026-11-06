import type { ButtonHTMLAttributes } from "react";
import * as AlignButton from "@/components/align/button";
import { buttonVariants } from "@/components/align/button";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type Size = "sm" | "md" | "icon";

// Tradução do vocabulário do painel para o AlignUI (variant + mode + size).
const MAP: Record<Variant, { variant: "neutral" | "error"; mode: "filled" | "stroke" | "lighter" | "ghost" }> = {
  primary: { variant: "neutral", mode: "filled" },
  secondary: { variant: "neutral", mode: "lighter" },
  outline: { variant: "neutral", mode: "stroke" },
  ghost: { variant: "neutral", mode: "ghost" },
  destructive: { variant: "error", mode: "filled" },
};
const SIZE: Record<Size, "small" | "xsmall"> = { sm: "xsmall", md: "small", icon: "xsmall" };

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  const { variant: v, mode } = MAP[variant];
  return buttonVariants({ variant: v, mode, size: SIZE[size] }).root({ class: `${size === "icon" ? "w-8 px-0" : ""} ${extra}` });
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const { variant: v, mode } = MAP[variant];
  return (
    <AlignButton.Root
      type={type}
      variant={v}
      mode={mode}
      size={SIZE[size]}
      className={`${size === "icon" ? "w-8 px-0" : ""} ${className}`}
      {...props}
    />
  );
}
