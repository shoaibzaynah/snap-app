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
    <div className="p-5 rounded-3xl bg-[#0B0B0E] border border-white/10 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/devices"
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95"
            title="Back to All Devices"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="w-12 h-12 rounded-2xl bg-[#FFFC00]/15 border border-[#FFFC00]/40 flex items-center justify-center text-[#FFFC00]">
            <Smartphone className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">
                {device.child_name}&apos;s Device
              </h1>
              {device.is_online ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-extrabold text-xs shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white/60 font-semibold text-xs">
                  <span className="w-2 h-2 rounded-full bg-white/40" />
                  <span>Offline</span>
                </div>
              )}
            </div>
            <p className="text-xs text-white/50 mt-0.5 font-mono">
              {device.model || "Android"} &bull; Pairing Code:{" "}
              <strong className="text-[#FFFC00]">{device.pairing_code}</strong>
            </p>
          </div>
        </div>

        {/* Battery & Status */}
        <div className="flex items-center gap-2.5 bg-white/[0.04] border border-white/10 py-2 px-3.5 rounded-2xl text-xs">
          <div className="flex items-center gap-1.5">
            {device.is_charging ? (
              <BatteryCharging className="w-4 h-4 text-[#FFFC00]" />
            ) : (
              <Battery className={`w-4 h-4 ${isLowBattery ? "text-red-400" : "text-emerald-400"}`} />
            )}
            <span className="font-bold text-white/90">
              {device.battery_level}% {device.is_charging && "(Charging)"}
            </span>
          </div>
          <span className="text-white/20">&bull;</span>
          <div className="flex items-center gap-1 text-white/80">
            <span className="text-white/40">Seen:</span>
            <strong className="text-[#FFFC00] font-mono font-bold">{formatLocalTime(device.last_seen_at)}</strong>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="text-xs font-bold text-[#FFFC00] bg-[#FFFC00]/10 border border-[#FFFC00]/20 rounded-xl px-3 py-1.5 animate-fade-in">
          {feedback}
        </div>
      )}

      {/* Instant Action Bar — 2-col mobile, 4-col desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
        <button
          onClick={() => handleCommand("ring_siren")}
          disabled={ringing}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 font-bold text-xs border border-red-500/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <Volume2 className="w-4 h-4 shrink-0" />
          <span className="truncate">{ringing ? "Sending..." : "Ring Siren"}</span>
        </button>

        <button
          onClick={() => handleCommand("take_photo", { camera: "front" })}
          disabled={capturing !== null}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#FFFC00]/15 hover:bg-[#FFFC00]/25 text-[#FFFC00] font-bold text-xs border border-[#FFFC00]/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <Camera className="w-4 h-4 shrink-0" />
          <span className="truncate">{capturing === "front" ? "Queuing..." : "Front Snap"}</span>
        </button>

        <button
          onClick={() => handleCommand("take_photo", { camera: "back" })}
          disabled={capturing !== null}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all active:scale-95 disabled:opacity-50"
        >
          <Camera className="w-4 h-4 shrink-0" />
          <span className="truncate">{capturing === "back" ? "Queuing..." : "Back Snap"}</span>
        </button>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold text-xs border border-white/10 transition-all active:scale-95 disabled:opacity-50"
          title="Refresh All Hub Data"
        >
          <RefreshCw className={`w-4 h-4 shrink-0 ${isRefreshing ? "animate-spin text-[#FFFC00]" : ""}`} />
          <span className="truncate">{isRefreshing ? "Refreshing..." : "Refresh All"}</span>
        </button>
      </div>

    </div>
  );
};
