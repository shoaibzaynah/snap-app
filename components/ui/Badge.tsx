import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "active" | "expired" | "live" | "pending" | "warning";
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = "active", children, ...props }) => {
  const variantStyles = {
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    expired: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    live: "bg-[#FFFC00]/15 text-[#FFFC00] border-[#FFFC00]/30 animate-pulse",
    pending: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border tracking-wide select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {variant === "live" && <span className="w-1.5 h-1.5 rounded-full bg-[#FFFC00] inline-block" />}
      {children}
    </span>
  );
};
