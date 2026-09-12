// components/admin/devices/LiveStreamPlaceholder.tsx
"use client";

import React from "react";
import { Video, Volume2, Smartphone, Play } from "lucide-react";

interface Props {
  streamMode: "video" | "audio" | "screen";
  isOnline: boolean;
  onStart: () => void;
}

export const LiveStreamPlaceholder: React.FC<Props> = ({ streamMode, isOnline, onStart }) => {
  const isScreen = streamMode === "screen";
  const isVideo = streamMode === "video";
  return (
    <div className="text-center p-6 space-y-3 snap-dark-surface" data-dark-surface="true">
      <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-[#FFFC00]">
        {isScreen ? <Smartphone className="w-7 h-7 text-[#FFFC00]" /> : isVideo ? <Video className="w-7 h-7 text-[#FFFC00]" /> : <Volume2 className="w-7 h-7 text-[#FFFC00]" />}
      </div>
      <div>
        <h4 className="text-sm font-bold text-white tracking-wide">
          {isScreen ? "Live Screen Mirroring" : isVideo ? "Live Camera & Audio Feed" : "Live Audio-Only Listen-In"}
        </h4>
        <p className="text-xs text-white/70 max-w-sm mx-auto mt-1">
          {isScreen
            ? "Real-time phone display & gaming stream. Sub-150ms latency, zero database load."
            : isVideo
            ? "Direct P2P video stream from device. Sub-200ms latency, zero database load."
            : "Direct P2P live ambient audio. Camera stays off, saving 100% video battery."}
        </p>
      </div>
      <button
        onClick={onStart}
        disabled={!isOnline}
        className="py-2.5 px-5 rounded-2xl bg-[#FFFC00] text-black font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 inline-flex items-center gap-2 select-none"
      >
        <Play className="w-4 h-4 fill-black text-black" />
        <span className="text-black font-extrabold">
          {isOnline ? (isScreen ? "Start Screen Mirror" : isVideo ? "Start Live Feed" : "Start Live Listening") : "Device Offline"}
        </span>
      </button>
    </div>
  );
};
