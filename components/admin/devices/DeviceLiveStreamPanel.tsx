// components/admin/devices/DeviceLiveStreamPanel.tsx
"use client";

import React from "react";
import { Video, Volume2 } from "lucide-react";
import { LiveStreamControls } from "./LiveStreamControls";
import { LiveAudioVisualizer } from "./LiveAudioVisualizer";
import { LiveStreamPlaceholder } from "./LiveStreamPlaceholder";
import { useWebRtcStream } from "./useWebRtcStream";

interface Props {
  deviceId: string;
  childName?: string;
  isOnline: boolean;
  onSendCommand: (cmd: string, payload?: any, label?: string) => void;
}

export const DeviceLiveStreamPanel: React.FC<Props> = ({ deviceId, isOnline, onSendCommand }) => {
  const [aspectMode, setAspectMode] = React.useState<"9:16" | "16:9">("9:16");
  const {
    streamMode, setStreamMode, streaming, camera, toggleCamera, listenAudio, setListenAudio,
    audioActive, talking, statusText, videoRef, audioRef, startStream, stopStream, handleTalkStart, handleTalkStop,
  } = useWebRtcStream(deviceId, onSendCommand);

  return (
    <div className="space-y-4">
      {!streaming && (
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 w-full max-w-sm mx-auto select-none">
          <button
            onClick={() => setStreamMode("video")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 ${
              streamMode === "video"
                ? "bg-[#FFFC00] text-black shadow-md font-extrabold"
                : "text-slate-600 dark:text-white/60 hover:text-black dark:hover:text-white"
            }`}
          >
            <Video className="w-3.5 h-3.5 shrink-0" />
            <span>Camera + Audio</span>
          </button>
          <button
            onClick={() => setStreamMode("audio")}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 ${
              streamMode === "audio"
                ? "bg-[#FFFC00] text-black shadow-md font-extrabold"
                : "text-slate-600 dark:text-white/60 hover:text-black dark:hover:text-white"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 shrink-0" />
            <span>Audio Only</span>
          </button>
        </div>
      )}

      <div className={`relative w-full ${
        aspectMode === "9:16" ? "max-w-[340px] aspect-[9/16]" : "max-w-[780px] aspect-video"
      } max-h-[560px] mx-auto rounded-3xl overflow-hidden bg-black border border-slate-200 dark:border-white/10 shadow-2xl flex items-center justify-center transition-all duration-300`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain ${
            streaming && streamMode === "video" ? "block" : "hidden"
          }`}
        />
        <audio ref={audioRef} autoPlay playsInline />
        {streaming && streamMode === "audio" && <LiveAudioVisualizer audioActive={audioActive} audioRef={audioRef} />}
        {!streaming && <LiveStreamPlaceholder streamMode={streamMode} isOnline={isOnline} onStart={() => startStream(streamMode)} />}

        {streaming && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none gap-2">
            <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/10 text-xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="font-bold text-white uppercase text-[10px] tracking-wider shrink-0">LIVE</span>
              <span className="text-emerald-400 font-mono text-[10px] truncate max-w-[85px]">{statusText}</span>
            </div>
            {streamMode === "video" && (
              <span className="text-[10px] font-mono py-1 px-2.5 rounded-xl bg-black/85 text-[#FFFC00] border border-white/10 whitespace-nowrap shrink-0 font-bold">
                {camera === "front" ? "Front" : "Back"} &bull; {aspectMode}
              </span>
            )}
          </div>
        )}
      </div>

      <LiveStreamControls
        streaming={streaming} streamMode={streamMode} listenAudio={listenAudio}
        onToggleAudio={() => setListenAudio(!listenAudio)} camera={camera}
        onToggleCamera={toggleCamera} aspectMode={aspectMode}
        onToggleAspectMode={() => {
          const next = aspectMode === "9:16" ? "16:9" : "9:16";
          setAspectMode(next);
          onSendCommand("webrtc_stream", { action: "set_orientation", orientation: next === "16:9" ? "landscape" : "portrait" }, `Set ${next}`);
        }}
        talking={talking} onTalkStart={handleTalkStart}
        onTalkStop={handleTalkStop} onStopStream={stopStream}
      />
    </div>
  );
};
