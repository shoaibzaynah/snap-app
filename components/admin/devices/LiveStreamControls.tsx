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
  aspectMode?: "9:16" | "16:9";
  onToggleAspectMode?: () => void;
  talking: boolean;
  onTalkStart: () => void;
  onTalkStop: () => void;
  onStopStream: () => void;
}

export const LiveStreamControls: React.FC<Props> = ({
  streaming, streamMode, listenAudio, onToggleAudio, camera, onToggleCamera,
  aspectMode = "9:16", onToggleAspectMode, talking, onTalkStart, onTalkStop, onStopStream,
}) => {
  if (!streaming) return null;

  return (
    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
      {/* Row 1: Mode & Camera Toggles */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onToggleAudio}
          className={`flex-1 sm:flex-none py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
            listenAudio ? "bg-[#FFFC00]/15 border-[#FFFC00]/30 text-[#FFFC00]" : "bg-white/5 border-white/10 text-white/50"
          }`}
        >
          {listenAudio ? <Mic className="w-3.5 h-3.5 shrink-0" /> : <MicOff className="w-3.5 h-3.5 shrink-0" />}
          <span>{listenAudio ? "Audio On" : "Muted"}</span>
        </button>

        {streamMode === "video" && (
          <>
            <button
              onClick={onToggleCamera}
              className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <SwitchCamera className="w-3.5 h-3.5 shrink-0" />
              <span>Flip {camera === "front" ? "Back" : "Front"}</span>
            </button>

            {onToggleAspectMode && (
              <button
                onClick={onToggleAspectMode}
                className={`flex-1 sm:flex-none py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  aspectMode === "16:9"
                    ? "bg-[#FFFC00]/15 border-[#FFFC00]/30 text-[#FFFC00]"
                    : "bg-white/5 border-white/10 text-white/80 hover:text-white"
                }`}
                title="Switch between TikTok 9:16 Portrait and YouTube 16:9 Widescreen"
              >
                <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                <span>{aspectMode === "16:9" ? "16:9 YouTube" : "9:16 TikTok"}</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Row 2: Walkie-Talkie & Stop Action */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { if (talking) onTalkStop(); else onTalkStart(); }}
          onMouseDown={onTalkStart} onMouseUp={onTalkStop} onMouseLeave={onTalkStop}
          onTouchStart={onTalkStart} onTouchEnd={onTalkStop} onTouchCancel={onTalkStop}
          className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold border transition-all select-none flex items-center justify-center gap-1.5 ${
            talking
              ? "bg-red-500 text-white border-red-400 scale-[0.98] shadow-lg shadow-red-500/20 animate-pulse"
              : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
          }`}
          title={talking ? "Click or release to stop talking" : "Click or hold to talk (Walkie-Talkie)"}
        >
          <Mic className="w-3.5 h-3.5 shrink-0" />
          <span>{talking ? "Transmitting (Tap to Stop)" : "Hold to Talk (Walkie-Talkie)"}</span>
        </button>

        <button
          onClick={onStopStream}
          className="py-2.5 px-3.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          <Square className="w-3.5 h-3.5 fill-red-400 shrink-0" />
          <span>Stop</span>
        </button>
      </div>
    </div>
  );
};
