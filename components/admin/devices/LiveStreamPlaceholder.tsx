// components/admin/devices/LiveStreamPlaceholder.tsx
"use client";

import React from "react";
import { Video, Volume2, Play, WifiOff } from "lucide-react";

interface Props {
  streamMode: "video" | "audio";
  isOnline: boolean;
  onStart: () => void;
}

export const LiveStreamPlaceholder: React.FC<Props> = ({ streamMode, isOnline, onStart }) => {
  return (
    <div className="text-center p-6 space-y-4 max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 flex items-center justify-center mx-auto text-[#FFFC00] shadow-inner">
        {streamMode === "video" ? <Video className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
      </div>
      <div>
        <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
          {streamMode === "video" ? "Live Camera & Audio Feed" : "Live Audio-Only Listen-In"}
        </h4>
        <p className="text-[11px] sm:text-xs text-white/50 max-w-xs mx-auto mt-1 leading-relaxed">
          {streamMode === "video"
            ? "Direct P2P low-latency video stream. Zero database load."
            : "Direct P2P live ambient audio. Saves 100% camera battery."}
        </p>
      </div>

      <div>
        {isOnline ? (
          <button
            onClick={onStart}
            className="py-2.5 px-6 rounded-full bg-[#FFFC00] text-black font-black text-xs shadow-lg shadow-[#FFFC00]/25 hover:brightness-105 active:scale-95 inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black" />
            {streamMode === "video" ? "Start Live Feed" : "Start Live Listening"}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs font-semibold select-none">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Device Offline</span>
          </div>
        )}
      </div>
    </div>
  );
};

