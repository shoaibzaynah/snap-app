// components/admin/devices/DeviceLockTimelineSection.tsx
"use client";

import React from "react";
import { DeviceLockEvent } from "@/lib/device-telemetry-types";
import { Lock, Unlock, Eye } from "lucide-react";

interface Props {
  lockEvents: DeviceLockEvent[];
}

export const DeviceLockTimelineSection: React.FC<Props> = ({ lockEvents }) => {
  return (
    <div className="bg-white/80 dark:bg-[#121216]/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-500">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xs tracking-tight">
              Lock Screen &amp; Device Activity
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-white/40">Screen on/off &amp; user present transitions</p>
          </div>
        </div>
        <span className="text-[9px] font-mono text-slate-400">{lockEvents.length} Events</span>
      </div>

      {lockEvents.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">No lock screen events logged yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {lockEvents.slice(0, 15).map((e) => {
            const isUnlock = e.event_type === "user_present";
            const isScreenOn = e.event_type === "screen_on";
            return (
              <div key={e.id} className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    isUnlock ? "bg-emerald-500/15 text-emerald-500" : isScreenOn ? "bg-amber-500/15 text-amber-500" : "bg-slate-500/15 text-slate-400"
                  }`}>
                    {isUnlock ? <Unlock className="w-3.5 h-3.5" /> : isScreenOn ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {isUnlock ? "Device Unlocked" : isScreenOn ? "Screen Turned ON" : "Screen Locked (OFF)"}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(e.event_time).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
