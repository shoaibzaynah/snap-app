// components/admin/devices/StreamRecordControl.tsx
"use client";

import React from "react";
import { Circle, Square, HardDrive, CheckCircle2 } from "lucide-react";

interface StreamRecordControlProps {
  isRecording: boolean;
  duration: number;
  lastSaved: string | null;
  streamMode: "video" | "audio";
  onStart: () => void;
  onStop: () => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export const StreamRecordControl: React.FC<StreamRecordControlProps> = ({
  isRecording,
  duration,
  lastSaved,
  streamMode,
  onStart,
  onStop,
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {!isRecording ? (
        <button
          onClick={onStart}
          className="w-full py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 active:scale-[0.98] border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          title={`Record ${streamMode === "video" ? "video and voice" : "audio"} directly to admin device`}
        >
          <Circle className="w-3.5 h-3.5 fill-red-500 text-red-500" />
          <span>Record {streamMode === "video" ? "Video + Voice" : "Audio"} (Save to Device)</span>
        </button>
      ) : (
        <div className="w-full p-2 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2 pl-1.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-xs font-mono font-bold text-red-300 tracking-wider">
              REC {formatDuration(duration)}
            </span>
            <span className="text-[10px] text-red-400/70 hidden sm:inline">
              • Saving local
            </span>
          </div>

          <button
            onClick={onStop}
            className="py-1.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-md shrink-0"
          >
            <Square className="w-3 h-3 fill-white" />
            <span>Stop &amp; Save</span>
          </button>
        </div>
      )}

      {/* Local save notification */}
      {lastSaved && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono animate-fadeIn">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="truncate">Saved: {lastSaved}</span>
          <HardDrive className="w-3 h-3 text-emerald-400/60 ml-auto shrink-0" />
        </div>
      )}
    </div>
  );
};
