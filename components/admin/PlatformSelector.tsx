// components/admin/PlatformSelector.tsx
"use client";

import React from "react";
import Image from "next/image";
import { PlatformType } from "@/lib/types";
import { EXPLICIT_PLATFORMS } from "@/lib/branding";
import { Globe, Link as LinkIcon } from "lucide-react";

interface PlatformSelectorProps {
  value: PlatformType | string;
  onChange: (platform: PlatformType) => void;
  label?: string;
}

const PLATFORM_LIST: Array<{ id: PlatformType; name: string }> = [
  { id: "instagram", name: "Instagram" },
  { id: "tiktok", name: "TikTok" },
  { id: "snapchat", name: "Snapchat" },
  { id: "youtube", name: "YouTube" },
  { id: "facebook", name: "Facebook" },
  { id: "twitter", name: "X (Twitter)" },
  { id: "whatsapp", name: "WhatsApp" },
  { id: "pinterest", name: "Pinterest" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "reddit", name: "Reddit" },
  { id: "browser", name: "Web Browser" },
  { id: "custom", name: "Custom Link" },
];

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  value,
  onChange,
  label = "Viewer Theme & Social Platform",
}) => {
  const currentKey = (value === "x" ? "twitter" : value) || "snapchat";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-900 dark:text-white">
          {label}
        </label>
        <span className="text-[10px] text-slate-500 dark:text-white/40 uppercase font-mono">
          Selected: {PLATFORM_LIST.find((p) => p.id === currentKey)?.name || currentKey}
        </span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 max-h-[190px] overflow-y-auto p-1.5 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10">
        {PLATFORM_LIST.map((item) => {
          const isSelected = currentKey === item.id;
          const branding = EXPLICIT_PLATFORMS[item.id];

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex items-center gap-1.5 p-2 rounded-xl text-left transition-all border ${
                isSelected
                  ? "bg-white dark:bg-white/15 border-amber-500 dark:border-[#FFFC00] shadow-md scale-[1.02]"
                  : "bg-transparent border-transparent hover:bg-white/50 dark:hover:bg-white/5 text-slate-600 dark:text-white/60"
              }`}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-black/10 dark:bg-white/10 p-0.5">
                {item.id === "browser" ? (
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                ) : item.id === "custom" ? (
                  <LinkIcon className="w-3.5 h-3.5 text-purple-400" />
                ) : branding?.logoUrl ? (
                  <Image
                    src={branding.logoUrl}
                    alt={item.name}
                    width={18}
                    height={18}
                    className="w-full h-full object-contain"
                    unoptimized={!branding.isSnap}
                  />
                ) : (
                  <span className="text-xs">🌐</span>
                )}
              </div>
              <span className={`text-[11px] font-bold truncate ${isSelected ? "text-slate-900 dark:text-white" : ""}`}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
