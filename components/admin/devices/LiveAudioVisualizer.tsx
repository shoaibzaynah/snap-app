// components/admin/devices/LiveAudioVisualizer.tsx
"use client";

import React from "react";
import { Radio } from "lucide-react";

export const LiveAudioVisualizer: React.FC = () => {
  return (
    <div className="text-center p-8 space-y-4">
      <div className="w-20 h-20 rounded-full bg-[#FFFC00]/10 border-2 border-[#FFFC00] flex items-center justify-center mx-auto text-[#FFFC00] shadow-[0_0_30px_rgba(255,252,0,0.3)] animate-pulse">
        <Radio className="w-10 h-10" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-white">Live Microphone Stream Active</h4>
        <p className="text-xs text-white/50 mt-1">Listening to surroundings in real-time. Camera sensors powered down (0% battery drain).</p>
      </div>
      <div className="flex items-center justify-center gap-1.5 pt-2">
        {[40, 70, 30, 90, 60, 80, 50, 95, 45, 65, 35].map((h, i) => (
          <span key={i} className="w-1.5 bg-[#FFFC00] rounded-full animate-bounce" style={{ height: `${h * 0.35}px`, animationDelay: `${i * 90}ms` }} />
        ))}
      </div>
    </div>
  );
};
