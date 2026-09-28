"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  icon?: ReactNode;
};

export function FormField({ label, error, icon, className, ...props }: FormFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#27352f]">{label}</span>
      <span
        className={cn(
          "mt-2 flex h-12 items-center gap-3 rounded-2xl border bg-white/90 px-4 shadow-sm transition focus-within:border-[#00a884]/60 focus-within:ring-4 focus-within:ring-[#00a884]/10",
          error ? "border-[#f04438]" : "border-[#d8ddd7]",
        )}
      >
        {icon ? <span className="text-[#66756f]">{icon}</span> : null}
        <input
          className={cn(
            "min-w-0 flex-1 bg-transparent text-sm text-[#17211c] outline-none placeholder:text-[#8a9691]",
            className,
          )}
          {...props}
        />
      </span>
      {error ? <span className="mt-1 block text-xs font-medium text-[#b42318]">{error}</span> : null}
    </label>
  );
}
