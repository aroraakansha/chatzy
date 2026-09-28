import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type PageCardProps = {
  children: ReactNode;
  className?: string;
};

export function PageCard({ children, className }: PageCardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-white/70 bg-white/82 p-5 shadow-[0_24px_70px_rgb(28_45_38/0.10)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </section>
  );
}
