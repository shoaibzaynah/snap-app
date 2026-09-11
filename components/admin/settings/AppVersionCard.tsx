// components/admin/settings/AppVersionCard.tsx
"use client";

import React from "react";
import {
  APP_VERSION,
  APP_BUILD_NUMBER,
  COMPANION_APP_VERSION,
  COMPANION_APP_VERSION_CODE,
} from "@/lib/companion-config";
import { Sparkles, Layers, Smartphone, CheckCircle2 } from "lucide-react";

export const AppVersionCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#121212] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-500 dark:text-[#FFFC00]" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">App Version &amp; Build Telemetry</h2>
            <p className="text-xs text-slate-500 dark:text-white/50">Current release manifests and runtime build metrics</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
          <CheckCircle2 className="w-3 h-3" /> Live Production
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="bg-slate-50 dark:bg-white/[0.03] p-3.5 rounded-xl border border-slate-200/80 dark:border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider">Web Application</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-base font-bold text-slate-900 dark:text-white font-mono">v{APP_VERSION}</p>
          <p className="text-[11px] text-slate-500 dark:text-white/50 font-mono">Build #{APP_BUILD_NUMBER} • Next.js 14</p>
        </div>

        <div className="bg-slate-50 dark:bg-white/[0.03] p-3.5 rounded-xl border border-slate-200/80 dark:border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider">Companion APK</span>
            <Smartphone className="w-3.5 h-3.5 text-amber-500 dark:text-[#FFFC00]" />
          </div>
          <p className="text-base font-bold text-slate-900 dark:text-white font-mono">v{COMPANION_APP_VERSION}</p>
          <p className="text-[11px] text-slate-500 dark:text-white/50 font-mono">Build Code {COMPANION_APP_VERSION_CODE} • Android</p>
        </div>
      </div>
    </div>
  );
};
