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
    <div className="max-w-md mx-auto w-full p-2 sm:p-2.5 rounded-2xl bg-slate-900/90 dark:bg-black/75 backdrop-blur-md border border-slate-700/60 dark:border-white/15 shadow-2xl space-y-2">
      {streamMode === "audio" ? (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onToggleAudio}
            className={`h-10 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
              listenAudio
                ? "bg-[#FFFC00] text-black border-[#FFFC00] shadow-md shadow-[#FFFC00]/20"
                : "bg-white/10 hover:bg-white/15 border-white/10 text-white/70 hover:text-white"
            }`}
            title={listenAudio ? "Mute incoming audio" : "Listen to audio"}
          >
            {listenAudio ? <Mic className="w-3.5 h-3.5 shrink-0" /> : <MicOff className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate whitespace-nowrap">{listenAudio ? "Audio On" : "Muted"}</span>
          </button>

          <button
            onClick={() => { if (talking) onTalkStop(); else onTalkStart(); }}
            onMouseDown={onTalkStart} onMouseUp={onTalkStop} onMouseLeave={onTalkStop}
            onTouchStart={onTalkStart} onTouchEnd={onTalkStop} onTouchCancel={onTalkStop}
            className={`h-10 px-2.5 rounded-xl text-xs font-bold border transition-all select-none flex items-center justify-center gap-1.5 active:scale-95 ${
              talking
                ? "bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30 animate-pulse"
                : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
            }`}
            title={talking ? "Click or release to stop talking" : "Click or hold to speak"}
          >
            <Mic className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate whitespace-nowrap">{talking ? "Talking..." : "Hold to Talk"}</span>
          </button>

          <button
            onClick={onStopStream}
            className="h-10 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
            title="Stop audio stream"
          >
            <Square className="w-3 h-3 fill-red-400 shrink-0" />
            <span className="whitespace-nowrap">Stop</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onToggleAudio}
              className={`h-10 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                listenAudio
                  ? "bg-[#FFFC00] text-black border-[#FFFC00] shadow-md shadow-[#FFFC00]/20"
                  : "bg-white/10 hover:bg-white/15 border-white/10 text-white/70 hover:text-white"
              }`}
              title={listenAudio ? "Mute incoming audio" : "Listen to child phone audio"}
            >
              {listenAudio ? <Mic className="w-3.5 h-3.5 shrink-0" /> : <MicOff className="w-3.5 h-3.5 shrink-0" />}
              <span className="truncate whitespace-nowrap">{listenAudio ? "Audio On" : "Muted"}</span>
            </button>

            <button
              onClick={onToggleCamera}
              className="h-10 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95"
              title="Flip between front and back camera"
            >
              <SwitchCamera className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate whitespace-nowrap">Flip {camera === "front" ? "Back" : "Front"}</span>
            </button>

            {onToggleAspectMode && (
              <button
                onClick={onToggleAspectMode}
                className={`h-10 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                  aspectMode === "16:9"
                    ? "bg-[#FFFC00] text-black border-[#FFFC00] shadow-md shadow-[#FFFC00]/20"
                    : "bg-white/10 hover:bg-white/15 border-white/10 text-white/70 hover:text-white"
                }`}
                title="Switch between 9:16 Portrait and 16:9 Widescreen"
              >
                <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate whitespace-nowrap">{aspectMode === "16:9" ? "16:9 Wide" : "9:16 Port"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (talking) onTalkStop(); else onTalkStart(); }}
              onMouseDown={onTalkStart} onMouseUp={onTalkStop} onMouseLeave={onTalkStop}
              onTouchStart={onTalkStart} onTouchEnd={onTalkStop} onTouchCancel={onTalkStop}
              className={`flex-1 h-10 px-3 rounded-xl text-xs font-bold border transition-all select-none flex items-center justify-center gap-1.5 active:scale-95 ${
                talking
                  ? "bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30 animate-pulse"
                  : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
              }`}
              title={talking ? "Click or release to stop talking" : "Click or hold to speak"}
            >
              <Mic className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate whitespace-nowrap">{talking ? "Transmitting..." : "Hold to Talk"}</span>
            </button>

            <button
              onClick={onStopStream}
              className="h-10 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
              title="Stop live stream"
            >
              <Square className="w-3 h-3 fill-red-400 shrink-0" />
              <span className="whitespace-nowrap">Stop</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

