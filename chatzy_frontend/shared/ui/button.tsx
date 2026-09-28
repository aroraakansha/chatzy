import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
};

const variants = {
  primary: "bg-[#00a884] text-white shadow-sm hover:bg-[#008f72] hover:shadow-md",
  secondary:
    "border border-[#d8ddd7] bg-white/85 text-[#17211c] hover:border-[#00a884]/50 hover:text-[#008069] hover:shadow-sm",
  ghost: "text-[#56645e] hover:bg-white/80 hover:text-[#008069]",
  danger: "bg-[#fee4e2] text-[#b42318] hover:bg-[#fecdca]",
};

const sizes = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  icon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
