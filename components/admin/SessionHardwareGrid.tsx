// components/admin/SessionHardwareGrid.tsx
"use client";

import React from "react";
import { DeviceInfo } from "@/lib/types";
import { Smartphone, Cpu, Battery, BatteryCharging, Wifi, Globe, Radio } from "lucide-react";

interface Props {
  dev?: DeviceInfo | null;
}

export const SessionHardwareGrid: React.FC<Props> = ({ dev }) => {
  if (!dev) return null;

  return (
    <div className="space-y-2 bg-slate-50 dark:bg-white/[0.03] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
          <Smartphone className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
          <span>Device &amp; Hardware Telemetry</span>
        </div>
        {dev.city && (
          <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-mono flex items-center gap-1">
            <Globe className="w-3 h-3" /> {dev.city}, {dev.country || ""}
          </span>
        )}
      </div>

      {(dev.isp || dev.carrier || dev.isCellular !== undefined) && (
        <div className="bg-slate-100 dark:bg-white/[0.04] p-2.5 rounded-xl border border-slate-200/80 dark:border-white/5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {dev.isCellular ? (
              <Radio className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            ) : (
              <Wifi className="w-4 h-4 text-cyan-500 dark:text-cyan-400 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 dark:text-white/40 font-semibold uppercase tracking-wider">
                {dev.isCellular ? "SIM Carrier (Mobile Data)" : "Internet Provider (ISP / WiFi)"}
              </p>
              <p className="font-bold text-slate-900 dark:text-white truncate">
                {dev.carrier || dev.isp || "Cellular / Broadband"}
              </p>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono shrink-0 uppercase tracking-wider ${
              dev.isCellular
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
            }`}
          >
            {dev.isCellular ? "Mobile SIM" : "WiFi / LAN"}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-white/70">
        <div>
          <p className="text-[10px] text-slate-400 dark:text-white/40 font-semibold uppercase tracking-wider">OS &amp; Browser</p>
          <p className="font-semibold text-slate-900 dark:text-white truncate">
            {dev.os || "Unknown"} • {dev.browser || "Browser"}
          </p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-white/40 font-semibold uppercase tracking-wider">CPU &amp; Memory</p>
          <p className="font-mono text-slate-900 dark:text-white truncate flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            {dev.cpuCores ? `${dev.cpuCores}-Core` : "—"}
            {dev.deviceMemory ? ` • ${dev.deviceMemory}GB RAM` : ""}
          </p>
        </div>

        {dev.gpu && (
          <div className="col-span-2">
            <p className="text-[10px] text-slate-400 dark:text-white/40 font-semibold uppercase tracking-wider">GPU Chipset</p>
            <p className="font-mono text-[11px] text-slate-900 dark:text-white truncate">{dev.gpu}</p>
          </div>
        )}

        <div>
          <p className="text-[10px] text-slate-400 dark:text-white/40 font-semibold uppercase tracking-wider">Display &amp; Scale</p>
          <p className="truncate font-mono">{dev.screen || "—"} {dev.pixelRatio ? `(@${dev.pixelRatio}x)` : ""}</p>
        </div>

        <div>
          <p className="text-[10px] text-slate-400 dark:text-white/40 font-semibold uppercase tracking-wider">Network &amp; Latency</p>
          <p className="truncate font-mono flex items-center gap-1">
            <Wifi className="w-3 h-3 text-emerald-400" />
            {dev.connection || "Online"}
            {dev.downlink ? ` • ${dev.downlink}M` : ""}
            {dev.rtt ? ` • ${dev.rtt}ms` : ""}
          </p>
        </div>
      </div>

      {dev.battery !== null && dev.battery !== undefined && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-[#FFFC00] pt-1 font-mono border-t border-white/5">
          {dev.isCharging ? <BatteryCharging className="w-3.5 h-3.5" /> : <Battery className="w-3.5 h-3.5" />}
          <span>Battery: {dev.battery}% {dev.isCharging ? "(Charging)" : ""}</span>
        </div>
      )}
    </div>
  );
};
