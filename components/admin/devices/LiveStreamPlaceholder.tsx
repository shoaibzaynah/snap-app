// components/admin/devices/LiveStreamPlaceholder.tsx
"use client";

import React from "react";
import { Video, Volume2, Play } from "lucide-react";

interface Props {
  streamMode: "video" | "audio";
  isOnline: boolean;
  onStart: () => void;
}

export const LiveStreamPlaceholder: React.FC<Props> = ({ streamMode, isOnline, onStart }) => {
  return (
    <div className="text-center p-6 space-y-3">
      <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#FFFC00]">
        {streamMode === "video" ? <Video className="w-7 h-7" /> : <Volume2 className="w-7 h-7" />}
      </div>
      <div>
        <h4 className="text-sm font-bold text-white">
          {streamMode === "video" ? "Live Camera & Audio Feed" : "Live Audio-Only Listen-In"}
        </h4>
        <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
          {streamMode === "video"
            ? "Direct P2P video stream from device. Sub-200ms latency, zero database load."
            : "Direct P2P live ambient audio. Camera stays off, saving 100% video battery."}
        </p>
      </div>
      <button
        onClick={onStart}
        disabled={!isOnline}
        className="py-2.5 px-5 rounded-2xl bg-[#FFFC00] text-black font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
      >
        <Play className="w-4 h-4 fill-black" />
        {isOnline ? (streamMode === "video" ? "Start Live Feed" : "Start Live Listening") : "Device Offline"}
      </button>
    </div>
  );
};
