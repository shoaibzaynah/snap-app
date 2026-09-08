// components/ui/ThemeToggle.tsx
"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon } from "lucide-react";

interface Props {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<Props> = ({ className = "", showLabel = false }) => {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-xl bg-white/5 animate-pulse ${className}`} />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 p-2 rounded-xl transition-all active:scale-90 ${
        isDark
          ? "bg-white/5 hover:bg-white/10 text-[#FFFC00] hover:text-yellow-300"
          : "bg-black/5 hover:bg-black/10 text-amber-600 hover:text-amber-700 border border-black/10"
      } ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Theme"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {showLabel && (
        <span className="text-xs font-semibold">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
};
