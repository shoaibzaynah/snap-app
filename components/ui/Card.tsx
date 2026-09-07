import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "solid" | "glow";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-[#141418] border border-white/10 shadow-xl",
      glass: "bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-2xl",
      solid: "bg-[#0B0B0E] border border-white/5",
      glow: "bg-[#141418] border border-[#FFFC00]/30 shadow-[0_0_20px_rgba(255,252,0,0.15)]",
    };

    return (
      <div
        ref={ref}
        className={cn("rounded-2xl sm:rounded-3xl p-5 sm:p-6 transition-all", variantStyles[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
