// components/admin/settings/AppearanceSettingsCard.tsx
"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, Palette } from "lucide-react";

export const AppearanceSettingsCard: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-500">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Appearance &amp; Theme</h3>
            <p className="text-xs text-slate-500 dark:text-white/50">Switch between Obsidian Dark and High-Contrast Light Mode</p>
          </div>
        </div>
        <Badge variant={theme === "dark" ? "default" : "live"}>
          {theme === "dark" ? "Obsidian Dark" : "High-Contrast Light"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          onClick={() => setTheme("dark")}
          className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all ${
            theme === "dark"
              ? "bg-[#FFFC00]/10 border-[#FFFC00] text-amber-400 font-bold shadow-lg shadow-yellow-500/10 scale-[1.02]"
              : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Moon className="w-5 h-5" />
          <span className="text-xs">Obsidian Dark</span>
        </button>

        <button
          onClick={() => setTheme("light")}
          className={`p-4 rounded-2xl border flex flex-col items-center gap-2.5 transition-all ${
            theme === "light"
              ? "bg-amber-100 border-amber-400 text-amber-900 font-bold shadow-md scale-[1.02]"
              : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Sun className="w-5 h-5" />
          <span className="text-xs">High-Contrast Light</span>
        </button>
      </div>
    </Card>
  );
};
