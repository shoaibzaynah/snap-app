// components/admin/devices/DeviceDetailHeader.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MonitoredDevice } from "@/lib/device-types";
import { Badge } from "@/components/ui/Badge";
import {
  Smartphone,
  Battery,
  BatteryCharging,
  ArrowLeft,
  Volume2,
  Camera,
  RefreshCw,
} from "lucide-react";
import { formatLocalTime } from "@/lib/utils";

interface Props {
  device: MonitoredDevice;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const DeviceDetailHeader: React.FC<Props> = ({ device, onRefresh, isRefreshing }) => {
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
        setFeedback(`⚡ "${command}" queued for ${device.child_name}'s phone!`);
        setTimeout(() => setFeedback(null), 3500);
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
    <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0B0B0E] border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-xl space-y-3">
      {/* Top App Bar Header */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/admin/devices"
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white/70 hover:text-black dark:hover:text-white transition-all active:scale-95 shrink-0 border border-slate-200 dark:border-white/5"
            title="Back to All Devices"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="w-10 h-10 rounded-xl bg-[#FFFC00]/15 border border-[#FFFC00]/40 flex items-center justify-center text-[#FFFC00] shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                {device.child_name}&apos;s Device
              </h1>
              {device.is_online ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-600 dark:text-white/60 font-semibold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-white/40" />
                  Offline
                </span>
              )}
              {/* Mobile Compact Code Badge */}
              <span className="sm:hidden px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-[#FFFC00]/10 border border-amber-300 dark:border-[#FFFC00]/30 text-amber-800 dark:text-[#FFFC00] font-black text-[10px] font-mono tracking-wider select-all" title="Pairing Code">
                {device.pairing_code}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-white/50 font-mono truncate">
              {device.model || "Android Device"}
            </p>
          </div>
        </div>

        {/* Right Controls: Desktop Prominent Code Badge + Refresh Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-[#FFFC00]/10 border border-amber-300 dark:border-[#FFFC00]/30 font-mono">
            <span className="text-slate-500 dark:text-white/60 font-bold uppercase tracking-wider text-[10px]">Pairing Code:</span>
            <span className="text-amber-800 dark:text-[#FFFC00] font-black text-sm tracking-widest select-all">{device.pairing_code}</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white/60 hover:text-black dark:hover:text-white transition-all disabled:opacity-50 shrink-0 border border-slate-200 dark:border-white/5"
            title="Refresh Hub Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-700 dark:text-[#FFFC00]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Battery & Status Metric Strip */}
      <div className="flex items-center justify-between gap-2 py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-[11px]">
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white/90">
          {device.is_charging ? (
            <BatteryCharging className="w-3.5 h-3.5 text-amber-600 dark:text-[#FFFC00]" />
          ) : (
            <Battery className={`w-3.5 h-3.5 ${isLowBattery ? "text-red-500" : "text-emerald-500"}`} />
          )}
          <span>{device.battery_level}% {device.is_charging && "(Charging)"}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-600 dark:text-white/70 font-mono">
          <span className="text-slate-400 dark:text-white/40">Seen:</span>
          <strong className="text-amber-700 dark:text-[#FFFC00] font-bold">{formatLocalTime(device.last_seen_at)}</strong>
        </div>
      </div>

      {feedback && (
        <div className="text-xs font-bold text-amber-800 dark:text-[#FFFC00] bg-amber-50 dark:bg-[#FFFC00]/10 border border-amber-300 dark:border-[#FFFC00]/20 rounded-xl px-3 py-1.5 animate-fade-in">
          {feedback}
        </div>
      )}

      {/* Instant Action Bar - Equal 3-Column Native Grid */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          onClick={() => handleCommand("ring_siren")}
          disabled={ringing}
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-red-50 dark:bg-red-500/15 hover:bg-red-100 dark:hover:bg-red-500/25 text-red-700 dark:text-red-300 font-bold text-xs border border-red-200 dark:border-red-500/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <Volume2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{ringing ? "Ringing..." : "Ring Siren"}</span>
        </button>

        <button
          onClick={() => handleCommand("take_photo", { camera: "front" })}
          disabled={capturing !== null}
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-amber-50 dark:bg-[#FFFC00]/15 hover:bg-amber-100 dark:hover:bg-[#FFFC00]/25 text-amber-900 dark:text-[#FFFC00] font-bold text-xs border border-amber-200 dark:border-[#FFFC00]/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{capturing === "front" ? "Capturing..." : "Front Snap"}</span>
        </button>

        <button
          onClick={() => handleCommand("take_photo", { camera: "back" })}
          disabled={capturing !== null}
          className="flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-white/15 transition-all active:scale-95 disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{capturing === "back" ? "Capturing..." : "Back Snap"}</span>
        </button>
      </div>
    </div>
  );
};
