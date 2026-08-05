import { HeartPulse } from "lucide-react";
import { cn } from "../../lib/cn";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "mono";
  showWordmark?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { mark: "size-9 rounded-xl", icon: "size-4.5", word: "text-base" },
  md: { mark: "size-11 rounded-2xl", icon: "size-5.5", word: "text-xl sm:text-2xl" },
  lg: { mark: "size-16 rounded-3xl", icon: "size-8", word: "text-3xl" },
} as const;

export function Logo({ size = "md", variant = "default", showWordmark = true, className }: LogoProps) {
  const dims = sizeMap[size];

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-3", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center shadow-md",
          dims.mark,
          variant === "default"
            ? "bg-gradient-to-br from-brand-primary to-brand-accent text-white shadow-brand-primary/25"
            : "bg-slate-800 text-slate-300 shadow-none",
        )}
      >
        <HeartPulse className={dims.icon} aria-hidden="true" />
      </span>
      {showWordmark && (
        <span className="min-w-0 leading-tight">
          <span
            className={cn(
              "block truncate font-display font-extrabold tracking-tight",
              dims.word,
              variant === "default" ? "text-brand-text" : "text-slate-200",
            )}
          >
            MediGuide
          </span>
          {size === "md" && (
            <span
              className={cn(
                "hidden text-xs font-semibold uppercase tracking-[0.22em] sm:block",
                variant === "default" ? "text-brand-text-muted" : "text-slate-500",
              )}
            >
              AI-assisted health support
            </span>
          )}
        </span>
      )}
    </span>
  );
}
