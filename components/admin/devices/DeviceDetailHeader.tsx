// components/admin/devices/DeviceDetailHeader.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MonitoredDevice } from "@/lib/device-types";
import {
  Smartphone,
  Battery,
  BatteryCharging,
  ArrowLeft,
  Volume2,
  Camera,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { formatLocalTime } from "@/lib/utils";

interface Props {
  device: MonitoredDevice;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onOpenControls?: () => void;
}

export const DeviceDetailHeader: React.FC<Props> = ({ device, onRefresh, isRefreshing, onOpenControls }) => {
  const [ringing, setRinging] = useState(false);
  const [capturing, setCapturing] = useState<"front" | "back" | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCommand = async (command: string, payload?: Record<string, unknown>) => {
    try {
      if (command === "ring_siren") setRinging(true);
      if (command === "take_photo") setCapturing(payload?.camera as any);

      const res = await fetch(`/api/devices/${device.id}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, payload }),
      });
      if (res.ok) {
        setFeedback(`"${command}" sent to phone`);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      setFeedback("Failed to send command.");
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setRinging(false);
      setCapturing(null);
    }
  };

  const isLowBattery = device.battery_level <= 20;

  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-[#0B0B0E] border border-white/10 shadow-xl space-y-2">
      {/* Row 1: Back + Phone Icon + Device Name + Status + Battery Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link
            href="/admin/devices"
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all active:scale-95 shrink-0"
            title="Back to All Devices"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFFC00]/15 border border-[#FFFC00]/30 flex items-center justify-center text-[#FFFC00] shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
              {device.child_name}&apos;s Device
            </h1>
            {device.is_online ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[9px] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/50 font-semibold text-[9px] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                Offline
              </span>
            )}
          </div>
        </div>

        {/* Controls Button & Battery Pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenControls && (
            <button
              onClick={onOpenControls}
              className="flex items-center gap-1 py-1 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-[10px] sm:text-xs font-bold transition-all active:scale-95"
              title="Telemetry & Intelligence Controls"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Controls</span>
            </button>
          )}

          <div className="flex items-center gap-1 py-1 px-2 rounded-xl bg-white/[0.04] border border-white/10 text-[10px] sm:text-xs shrink-0">
            {device.is_charging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-[#FFFC00]" />
            ) : (
              <Battery className={`w-3.5 h-3.5 ${isLowBattery ? "text-red-400" : "text-emerald-400"}`} />
            )}
            <span className="font-bold text-white/90">
              {device.battery_level}%{device.is_charging && " ⚡"}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Model & Code on Left + Last Seen on Right */}
      <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs text-white/50 font-mono px-0.5">
        <div className="truncate min-w-0">
          <span>{device.model || "Android"}</span>
          <span className="text-white/20 mx-1.5">&bull;</span>
          <span>Code: <strong className="text-[#FFFC00]">{device.pairing_code}</strong></span>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-white/30">Seen: </span>
          <strong className="text-[#FFFC00]">{formatLocalTime(device.last_seen_at)}</strong>
        </div>
      </div>

      {feedback && (
        <div className="text-xs font-bold text-[#FFFC00] bg-[#FFFC00]/10 border border-[#FFFC00]/20 rounded-xl px-3 py-1.5 animate-fadeIn">
          {feedback}
        </div>
      )}

      {/* Row 3: Action Bar — 4 buttons in 1 row with short 1-word smart labels */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-2 border-t border-white/5">
        <button
          onClick={() => handleCommand("ring_siren")}
          disabled={ringing}
          className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 font-bold text-[11px] sm:text-xs border border-red-500/30 transition-all active:scale-95 disabled:opacity-50 min-h-[38px]"
        >
          <Volume2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{ringing ? "..." : "Siren"}</span>
        </button>

        <button
          onClick={() => handleCommand("take_photo", { camera: "front" })}
          disabled={capturing !== null}
          className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-[#FFFC00]/15 hover:bg-[#FFFC00]/25 text-[#FFFC00] font-bold text-[11px] sm:text-xs border border-[#FFFC00]/30 transition-all active:scale-95 disabled:opacity-50 min-h-[38px]"
        >
          <Camera className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{capturing === "front" ? "..." : "Front"}</span>
        </button>

        <button
          onClick={() => handleCommand("take_photo", { camera: "back" })}
          disabled={capturing !== null}
          className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] sm:text-xs border border-white/15 transition-all active:scale-95 disabled:opacity-50 min-h-[38px]"
        >
          <Camera className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{capturing === "back" ? "..." : "Back"}</span>
        </button>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-1 py-2 px-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-[11px] sm:text-xs border border-white/10 transition-all active:scale-95 disabled:opacity-50 min-h-[38px]"
          title="Refresh All Hub Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? "animate-spin text-[#FFFC00]" : ""}`} />
          <span className="truncate">{isRefreshing ? "..." : "Refresh"}</span>
        </button>
      </div>
    </div>
  );
};
