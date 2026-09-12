// components/admin/devices/DeviceSecurityTab.tsx
"use client";

import React from "react";
import { DeviceLockEvent, DeviceWifiNetwork } from "@/lib/device-telemetry-types";
import { ShieldCheck, ShieldAlert, Zap, ZapOff } from "lucide-react";
import { DeviceWifiSection } from "./DeviceWifiSection";
import { DeviceLockTimelineSection } from "./DeviceLockTimelineSection";

interface Props {
  lockEvents: DeviceLockEvent[];
  wifiNetworks: DeviceWifiNetwork[];
  currentSsid?: string | null;
  persistenceStatus?: {
    isAdmin?: boolean;
    isAccessibility?: boolean;
    isBatteryWhitelisted?: boolean;
  };
  onScanWifi?: () => void;
  onTogglePersistence?: (key: string, val: boolean) => void;
  loading?: boolean;
}

export const DeviceSecurityTab: React.FC<Props> = ({
  lockEvents,
  wifiNetworks,
  currentSsid,
  persistenceStatus = {},
  onScanWifi,
  onTogglePersistence,
  loading,
}) => {
  const cards = [
    {
      key: "is_accessibility_active",
      title: "Accessibility Service",
      desc: "Background watchdog & unkillable process",
      active: Boolean(persistenceStatus.isAccessibility),
      activeText: "OS VERIFIED ✓",
      inactiveText: "DISABLED ✗",
      activeSub: "Active (Unkillable)",
      inactiveSub: "Action Required",
      IconActive: ShieldCheck,
      IconInactive: ShieldAlert,
    },
    {
      key: "is_device_admin",
      title: "Device Administrator",
      desc: "Anti-uninstall & tamper protection",
      active: Boolean(persistenceStatus.isAdmin),
      activeText: "PROTECTED ✓",
      inactiveText: "DISABLED ✗",
      activeSub: "Active (Protected)",
      inactiveSub: "Action Required",
      IconActive: ShieldCheck,
      IconInactive: ShieldAlert,
    },
    {
      key: "is_battery_unrestricted",
      title: "Battery Optimization",
      desc: "Zero-sleep sync without OEM freeze",
      active: Boolean(persistenceStatus.isBatteryWhitelisted),
      activeText: "UNRESTRICTED ✓",
      inactiveText: "RESTRICTED ✗",
      activeSub: "Unrestricted (No Sleep)",
      inactiveSub: "Action Required",
      IconActive: Zap,
      IconInactive: ZapOff,
    },
  ];

  return (
    <div className="space-y-4 text-xs">
      {/* 24/7 Anti-Sleep & Persistence Health */}
      <div className="bg-white/80 dark:bg-[#121216]/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs tracking-tight">
                24/7 Persistence &amp; Anti-Sleep Health
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-white/40">Verified live Android OS security status</p>
            </div>
          </div>
          <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 font-semibold">
            Live OS Telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {cards.map((c) => {
            const Icon = c.active ? c.IconActive : c.IconInactive;
            return (
              <div
                key={c.key}
                onClick={() => onTogglePersistence?.(c.key, !c.active)}
                className={`group p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${
                  c.active
                    ? "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/25 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/25 dark:border-rose-500/20 text-rose-700 dark:text-rose-400"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    c.active ? "bg-emerald-500/15 text-emerald-500" : "bg-rose-500/15 text-rose-500"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono ${
                    c.active
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                  }`}>
                    {c.active ? c.activeText : c.inactiveText}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-0.5">{c.title}</h4>
                <p className="text-[10px] text-slate-500 dark:text-white/50 leading-tight line-clamp-1">{c.desc}</p>
                <div className="mt-2.5 pt-2 border-t border-slate-200/40 dark:border-white/5 flex items-center justify-between text-[10px]">
                  <span className="font-semibold">{c.active ? c.activeSub : c.inactiveSub}</span>
                  <span className="opacity-40 text-[9px]">Tap to toggle</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Connected WiFi & Access Points Section */}
      <DeviceWifiSection
        currentSsid={currentSsid}
        wifiNetworks={wifiNetworks}
        onScanWifi={onScanWifi}
        loading={loading}
      />

      {/* Lock Screen Activity Timeline Section */}
      <DeviceLockTimelineSection lockEvents={lockEvents} />
    </div>
  );
};
