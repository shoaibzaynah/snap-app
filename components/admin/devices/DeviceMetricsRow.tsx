// components/admin/devices/DeviceMetricsRow.tsx
import React from "react";

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
      <div className="p-2 sm:p-5 rounded-xl sm:rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col justify-between transition-all">
        <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-white/50 tracking-wide uppercase truncate">
          <span className="sm:hidden">Kids</span>
          <span className="hidden sm:inline">Total Kids</span>
        </span>
        <span className="text-base sm:text-3xl font-black text-slate-900 dark:text-white mt-1 sm:mt-2 tracking-tight">
          {totalCount}
        </span>
      </div>

      <div className="p-2 sm:p-5 rounded-xl sm:rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col justify-between transition-all">
        <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-white/50 tracking-wide uppercase truncate">
          <span className="sm:hidden">Online</span>
          <span className="hidden sm:inline">Online Devices</span>
        </span>
        <span className="text-base sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 sm:mt-2 tracking-tight">
          {onlineCount}
        </span>
      </div>

      <div className="p-2 sm:p-5 rounded-xl sm:rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col justify-between transition-all">
        <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-white/50 tracking-wide uppercase truncate">
          <span className="sm:hidden">Low Batt</span>
          <span className="hidden sm:inline">Low Battery (&le;20%)</span>
        </span>
        <span
          className={`text-base sm:text-3xl font-black mt-1 sm:mt-2 tracking-tight ${
            lowBatteryCount > 0 ? "text-red-500" : "text-slate-700 dark:text-white/60"
          }`}
        >
          {lowBatteryCount}
        </span>
      </div>
    </div>
  );
};
