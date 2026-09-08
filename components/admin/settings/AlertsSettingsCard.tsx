// components/admin/settings/AlertsSettingsCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Bell } from "lucide-react";

export const AlertsSettingsCard: React.FC = () => {
  const [batteryThreshold, setBatteryThreshold] = useState("20");
  const [watchdogInterval, setWatchdogInterval] = useState("15");

  useEffect(() => {
    const savedBattery = localStorage.getItem("snap_battery_threshold");
    if (savedBattery) setBatteryThreshold(savedBattery);

    const savedWatchdog = localStorage.getItem("snap_watchdog_interval");
    if (savedWatchdog) setWatchdogInterval(savedWatchdog);
  }, []);

  const handleBatteryChange = (val: string) => {
    setBatteryThreshold(val);
    localStorage.setItem("snap_battery_threshold", val);
  };

  const handleWatchdogChange = (val: string) => {
    setWatchdogInterval(val);
    localStorage.setItem("snap_watchdog_interval", val);
  };

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Safety &amp; Alert Preferences</h3>
            <p className="text-xs text-slate-500 dark:text-white/50 leading-relaxed">
              Thresholds for child device low-battery alerts and watchdog pings
            </p>
          </div>
        </div>
        <div className="self-start sm:self-auto shrink-0">
          <Badge variant="active">Active</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-2">
          <span className="text-xs font-semibold text-slate-900 dark:text-white block">Low Battery Alert Level</span>
          <div className="flex items-center gap-2">
            {["15", "20", "25"].map((val) => (
              <button
                key={val}
                onClick={() => handleBatteryChange(val)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  batteryThreshold === val
                    ? "bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black shadow-sm"
                    : "bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent"
                }`}
              >
                &le; {val}%
              </button>
            ))}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-2">
          <span className="text-xs font-semibold text-slate-900 dark:text-white block">Inactivity Watchdog</span>
          <div className="flex items-center gap-2">
            {["5", "15", "30"].map((val) => (
              <button
                key={val}
                onClick={() => handleWatchdogChange(val)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  watchdogInterval === val
                    ? "bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black shadow-sm"
                    : "bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent"
                }`}
              >
                {val}m
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
