import { useState } from "react";
import { cn } from "@/shared/lib/cn";

type AvatarProps = {
  name: string;
  tone?: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  className?: string;
  title?: string;
  imageUrl?: string;
};

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({
  name,
  tone = "from-emerald-500 to-teal-700",
  size = "md",
  online,
  className,
  title,
  imageUrl,
}: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const tooltipText = title || name;
  const hasImage = Boolean(imageUrl?.trim()) && !imageFailed;

  return (
    <span
      className={cn("group relative z-30 inline-flex shrink-0 overflow-visible", className)}
      title={tooltipText}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={() => setShowTooltip((current) => !current)}
    >
      {hasImage ? (
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImageFailed(true)}
          className={cn("rounded-full object-cover shadow-sm", sizes[size])}
        />
      ) : (
        <span
          className={cn(
            "grid place-items-center rounded-full bg-gradient-to-br font-semibold text-white shadow-sm",
            tone,
            sizes[size],
          )}
        >
          {initials}
        </span>
      )}
      {online ? (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#101421] bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
      ) : null}
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-full z-[100] mt-2 w-max -translate-x-1/2 whitespace-nowrap rounded-xl bg-[#111827] px-3 py-2 text-[11px] font-medium text-white shadow-lg transition-all duration-150",
          showTooltip ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0",
        )}
      >
        {tooltipText}
      </span>
    </span>
  );
}
