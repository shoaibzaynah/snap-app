// components/admin/devices/LiveStreamControls.tsx
"use client";

import React from "react";
import { Mic, MicOff, SwitchCamera, Square, Maximize2 } from "lucide-react";

interface Props {
  streaming: boolean;
  streamMode: "video" | "audio";
  listenAudio: boolean;
  onToggleAudio: () => void;
  camera: "front" | "back";
  onToggleCamera: () => void;
  isWide16x9?: boolean;
  onToggleWide16x9?: () => void;
  talking: boolean;
  onTalkStart: () => void;
  onTalkStop: () => void;
  onStopStream: () => void;
}

export const LiveStreamControls: React.FC<Props> = ({
  streaming,
  streamMode,
  listenAudio,
  onToggleAudio,
  camera,
  onToggleCamera,
  isWide16x9 = false,
  onToggleWide16x9,
  talking,
  onTalkStart,
  onTalkStop,
  onStopStream,
}) => {
  if (!streaming) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleAudio}
          className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
            listenAudio ? "bg-[#FFFC00]/15 border-[#FFFC00]/30 text-[#FFFC00]" : "bg-white/5 border-white/10 text-white/50"
          }`}
        >
          {listenAudio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          {listenAudio ? "Listening" : "Muted"}
        </button>

        {streamMode === "video" && (
          <>
            <button
              onClick={onToggleCamera}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <SwitchCamera className="w-4 h-4" />
              Flip to {camera === "front" ? "Back" : "Front"}
            </button>

            {onToggleWide16x9 && (
              <button
                onClick={onToggleWide16x9}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isWide16x9
                    ? "bg-[#FFFC00]/15 border-[#FFFC00]/30 text-[#FFFC00]"
                    : "bg-white/5 border-white/10 text-white/70 hover:text-white"
                }`}
                title="Toggle between 16:9 Widescreen Fill and Original Fit"
              >
                <Maximize2 className="w-4 h-4" />
                <span>{isWide16x9 ? "16:9 Wide (Fill)" : "Fit Sensor"}</span>
              </button>
            )}
          </>
        )}

        <button
          onClick={() => { if (talking) onTalkStop(); else onTalkStart(); }}
          onMouseDown={onTalkStart}
          onMouseUp={onTalkStop}
          onMouseLeave={onTalkStop}
          onTouchStart={onTalkStart}
          onTouchEnd={onTalkStop}
          onTouchCancel={onTalkStop}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all select-none ${
            talking ? "bg-red-500 text-white border-red-400 scale-95 shadow-lg shadow-red-500/20 animate-pulse" : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
          }`}
          title={talking ? "Click or release to stop talking" : "Click or hold to talk"}
        >
          {talking ? "🎙️ Transmitting (Click to Stop)" : "🎙️ Hold to Talk (Walkie-Talkie)"}
        </button>
      </div>

      <button
        onClick={onStopStream}
        className="py-2 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
      >
        <Square className="w-3.5 h-3.5 fill-red-400" />
        Stop Feed
      </button>
    </div>
  );
};
