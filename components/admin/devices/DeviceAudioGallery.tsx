// components/admin/devices/DeviceAudioGallery.tsx
"use client";

import React from "react";
import { Mic, Clock, Trash2, Download, Play, Music } from "lucide-react";
import { getSnapImageUrl } from "@/lib/storage";

export interface AudioCapture {
  id: string;
  command: string;
  result_media_path: string;
  executed_at: string;
  payload?: { duration?: number };
}

interface Props {
  audioClips: AudioCapture[];
  onTriggerAudio: (duration: 15 | 30) => void;
  onDeleteAudio?: (commandId: string) => void;
}

export const DeviceAudioGallery: React.FC<Props> = ({ audioClips, onTriggerAudio, onDeleteAudio }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Mic className="w-5 h-5 text-[#FFFC00]" />
            Ambient Audio Recordings
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            On-demand lightweight 15s or 30s microphone voice memos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onTriggerAudio(15)}
            className="py-2 px-3 rounded-xl bg-[#FFFC00] hover:bg-[#ffe500] text-black font-bold text-xs transition-all active:scale-95 shadow-lg shadow-yellow-500/20"
          >
            🎙️ Record 15s
          </button>
          <button
            onClick={() => onTriggerAudio(30)}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95"
          >
            🎙️ Record 30s
          </button>
        </div>
      </div>

      {audioClips.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center">
          <Music className="w-10 h-10 text-white/20 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white/80">No Audio Recordings Yet</p>
          <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto">
            Click &quot;🎙️ Record 15s&quot; or &quot;🎙️ Record 30s&quot; to silently record surroundings.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {audioClips.map((clip) => {
            const audioUrl = getSnapImageUrl(clip.result_media_path);
            const duration = clip.payload?.duration || 15;

            return (
              <div
                key={clip.id}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FFFC00]/10 text-[#FFFC00] flex items-center justify-center shrink-0 border border-[#FFFC00]/20">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {duration}s Voice Memo
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        AAC 32kbps
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 flex items-center gap-1 font-mono mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(clip.executed_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <audio controls preload="none" className="h-9 max-w-[220px] rounded-lg">
                    <source src={audioUrl} type="audio/mp4" />
                    Your browser does not support audio playback.
                  </audio>

                  <a
                    href={audioUrl}
                    download="ambient-recording.m4a"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/10"
                    title="Download Audio"
                  >
                    <Download className="w-4 h-4" />
                  </a>

                  {onDeleteAudio && (
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this audio recording?")) {
                          onDeleteAudio(clip.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-600/80 text-white/70 hover:text-white transition-all border border-white/10"
                      title="Delete Audio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
