// components/admin/devices/DeviceWifiSection.tsx
"use client";

import React from "react";
import { DeviceWifiNetwork } from "@/lib/device-telemetry-types";
import { Wifi, RefreshCw, Signal } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  currentSsid?: string | null;
  wifiNetworks: DeviceWifiNetwork[];
  onScanWifi?: () => void;
  loading?: boolean;
}

export const DeviceWifiSection: React.FC<Props> = ({
  currentSsid,
  wifiNetworks,
  onScanWifi,
  loading,
}) => {
  return (
    <div className="bg-white/80 dark:bg-[#121216]/80 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-500">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xs tracking-tight">
              Connected WiFi &amp; Access Points
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-white/40">Real-time wireless environment scan</p>
          </div>
        </div>
        {onScanWifi && (
          <Button size="sm" variant="secondary" onClick={onScanWifi} disabled={loading} className="h-7 text-xs gap-1.5 rounded-xl font-bold">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Scan WiFi
          </Button>
        )}
      </div>

      {currentSsid ? (
        <div className="bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent border border-cyan-500/20 p-3.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-500">
              <Wifi className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wider font-extrabold text-cyan-600 dark:text-cyan-400 font-mono">Active Connection</p>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{currentSsid}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-mono border border-cyan-500/30">
            ● Connected
          </span>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 text-center text-slate-400 text-[11px]">
          No active WiFi connection reported by device
        </div>
      )}

      {wifiNetworks.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 px-1">
            Surrounding Networks ({wifiNetworks.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {wifiNetworks.map((net) => (
              <div key={net.id} className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{net.ssid || "Hidden Network"}</p>
                  <p className="text-[9px] font-mono text-slate-400 truncate">{net.bssid ? `BSSID: ${net.bssid}` : "—"}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Signal className="w-3.5 h-3.5 text-cyan-500 opacity-80" />
                  <span className="text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300">
                    {net.signal_level ? `${net.signal_level} dBm` : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
