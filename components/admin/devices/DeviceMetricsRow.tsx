// components/admin/devices/DeviceMetricsRow.tsx
import React from "react";

import { Smartphone, Radio, BatteryWarning } from "lucide-react";

interface Props {
  totalCount: number;
  onlineCount: number;
  lowBatteryCount: number;
}

export const DeviceMetricsRow: React.FC<Props> = ({
  totalCount,
  onlineCount,
  lowBatteryCount,
}) => {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
      <div className="p-2.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between text-slate-500 dark:text-white/50 text-[10px] sm:text-xs">
          <span className="font-semibold uppercase tracking-wider truncate">Kids</span>
          <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-[#FFFC00] shrink-0" />
        </div>
        <span className="text-lg sm:text-3xl font-black text-slate-900 dark:text-white mt-1 sm:mt-2 tracking-tight">
          {totalCount}
        </span>
      </div>

      <div className="p-2.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between text-slate-500 dark:text-white/50 text-[10px] sm:text-xs">
          <span className="font-semibold uppercase tracking-wider truncate">Online</span>
          <Radio className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
        </div>
        <span className="text-lg sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 sm:mt-2 tracking-tight">
          {onlineCount}
        </span>
      </div>

      <div className="p-2.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col justify-between transition-all">
        <div className="flex items-center justify-between text-slate-500 dark:text-white/50 text-[10px] sm:text-xs">
          <span className="font-semibold uppercase tracking-wider truncate">Low Batt</span>
          <BatteryWarning className={`w-3.5 h-3.5 ${lowBatteryCount > 0 ? "text-red-500" : "text-slate-400 dark:text-white/40"} shrink-0`} />
        </div>
        <span
          className={`text-lg sm:text-3xl font-black mt-1 sm:mt-2 tracking-tight ${
            lowBatteryCount > 0 ? "text-red-500" : "text-slate-900 dark:text-white"
          }`}
        >
          {lowBatteryCount}
        </span>
      </div>
    </div>
  );
};
