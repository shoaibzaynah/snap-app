// components/admin/settings/SecuritySettingsCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { ShieldCheck, Lock } from "lucide-react";

export const SecuritySettingsCard: React.FC = () => {
  const [sessionLock, setSessionLock] = useState("8h");

  useEffect(() => {
    const savedLock = localStorage.getItem("snap_session_lock");
    if (savedLock) setSessionLock(savedLock);
  }, []);

  const handleLockChange = (val: string) => {
    setSessionLock(val);
    localStorage.setItem("snap_session_lock", val);
  };

  return (
    <Card className="p-5 sm:p-6 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Admin Security &amp; Session Posture</h3>
            <p className="text-xs text-slate-500 dark:text-white/50">Protected operations session &bull; Zero credentials stored on client</p>
          </div>
        </div>
        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
          <Lock className="w-3.5 h-3.5" /> Protected
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-white/5">
        <div>
          <span className="text-xs font-semibold text-slate-900 dark:text-white block">Auto-Lock Inactive Session</span>
          <span className="text-[11px] text-slate-500 dark:text-white/40">Automatically require re-authentication after idle duration</span>
        </div>
        <div className="flex items-center gap-2">
          {["1h", "8h", "24h"].map((val) => (
            <button
              key={val}
              onClick={() => handleLockChange(val)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                sessionLock === val
                  ? "bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black shadow-sm"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent"
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};
