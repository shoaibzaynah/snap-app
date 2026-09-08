import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "active" | "expired" | "live" | "pending" | "warning" | "default";
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = "default", children, ...props }) => {
  const variantStyles = {
    default: "bg-white/10 text-white/80 border-white/15 dark:bg-white/10 dark:text-white/80",
    active: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30 font-semibold",
    expired: "bg-zinc-200 text-zinc-700 border-zinc-300 dark:bg-zinc-500/15 dark:text-zinc-400 dark:border-zinc-500/30 font-semibold",
    live: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-[#FFFC00]/15 dark:text-[#FFFC00] dark:border-[#FFFC00]/30 font-bold animate-pulse badge-live",
    pending: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30 font-semibold",
    warning: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 font-semibold",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border tracking-wide select-none transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {variant === "live" && <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-[#FFFC00] inline-block" />}
      {children}
    </span>
  );
};
