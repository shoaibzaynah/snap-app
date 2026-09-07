import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = "text", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-xs font-semibold text-white/70 tracking-wide uppercase px-1">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            "w-full px-4 py-3 bg-[#1C1C22] text-white placeholder-white/40 text-sm rounded-full sm:rounded-2xl border border-white/10 focus:border-[#FFFC00] focus:ring-2 focus:ring-[#FFFC00]/20 outline-none transition-all",
            error && "border-red-500/60 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400 px-2 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
