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

  const containerSizing = React.useMemo(() => {
    if (streamMode === "audio") {
      return "max-w-[420px] h-[220px] sm:h-[240px]";
    }
    if (aspectMode === "16:9") {
      return "max-w-[620px] aspect-video max-h-[380px]";
    }
    return "max-w-[310px] sm:max-w-[330px] aspect-[9/16] max-h-[480px] sm:max-h-[520px]";
  }, [streamMode, aspectMode]);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Top Segmented Pill Switcher (Image 1 Style) */}
      {!streaming && (
        <div className="flex justify-center">
          <div className="inline-flex items-center p-1 bg-slate-900/90 dark:bg-black/70 backdrop-blur-md rounded-full border border-slate-700/60 dark:border-white/15 shadow-xl">
            <button
              onClick={() => setStreamMode("video")}
              className={`flex items-center justify-center gap-2 py-2 px-4 sm:px-5 rounded-full text-xs font-black transition-all ${
                streamMode === "video"
                  ? "bg-[#FFFC00] text-black shadow-md shadow-[#FFFC00]/20"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Video className="w-3.5 h-3.5 shrink-0" />
              <span>Camera + Audio</span>
            </button>
            <button
              onClick={() => setStreamMode("audio")}
              className={`flex items-center justify-center gap-2 py-2 px-4 sm:px-5 rounded-full text-xs font-black transition-all ${
                streamMode === "audio"
                  ? "bg-[#FFFC00] text-black shadow-md shadow-[#FFFC00]/20"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 shrink-0" />
              <span>Audio Only</span>
            </button>
          </div>
        </div>
      )}

      {/* Live Stream / Placeholder Viewport */}
      <div
        className={`relative w-full ${containerSizing} mx-auto rounded-3xl overflow-hidden bg-black border border-slate-800 dark:border-white/10 shadow-2xl flex items-center justify-center transition-all duration-300`}
      >
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
        {streaming && streamMode === "audio" && (
          <LiveAudioVisualizer audioActive={audioActive} audioRef={audioRef} />
        )}
        {!streaming && (
          <LiveStreamPlaceholder
            streamMode={streamMode}
            isOnline={isOnline}
            onStart={() => startStream(streamMode)}
          />
        )}

        {streaming && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            <div className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-xs shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold text-white uppercase text-[10px] tracking-wider">LIVE</span>
              <span className="text-white/40 text-[10px]">&bull;</span>
              <span className="text-emerald-400 font-mono text-[10px]">{statusText}</span>
            </div>
            {streamMode === "video" && (
              <span className="text-[10px] font-mono py-1 px-2.5 rounded-xl bg-black/80 backdrop-blur-md text-[#FFFC00] border border-white/10 shadow-lg">
                Cam: {camera.toUpperCase()} • {aspectMode}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <LiveStreamControls
        streaming={streaming}
        streamMode={streamMode}
        listenAudio={listenAudio}
        onToggleAudio={() => setListenAudio(!listenAudio)}
        camera={camera}
        onToggleCamera={toggleCamera}
        aspectMode={aspectMode}
        onToggleAspectMode={() => {
          const next = aspectMode === "9:16" ? "16:9" : "9:16";
          setAspectMode(next);
          onSendCommand(
            "webrtc_stream",
            { action: "set_orientation", orientation: next === "16:9" ? "landscape" : "portrait" },
            `Set ${next}`
          );
        }}
        talking={talking}
        onTalkStart={handleTalkStart}
        onTalkStop={handleTalkStop}
        onStopStream={stopStream}
      />
    </div>
  );
};

