// components/admin/devices/DeviceLiveStreamPanel.tsx
"use client";

import React from "react";
import { Video, Volume2, Mic, MicOff, SwitchCamera, Square, Maximize2, VolumeX, Wifi, WifiOff, RotateCw } from "lucide-react";
import { LiveAudioVisualizer } from "./LiveAudioVisualizer";
import { LiveStreamPlaceholder } from "./LiveStreamPlaceholder";
import { useWebRtcStream } from "./useWebRtcStream";
import { useStreamRecorder } from "./useStreamRecorder";
import { StreamRecordControl } from "./StreamRecordControl";

interface Props { deviceId: string; childName?: string; isOnline: boolean; onSendCommand: (cmd: string, payload?: any, label?: string) => void; }

export const DeviceLiveStreamPanel: React.FC<Props> = ({ deviceId, childName, isOnline, onSendCommand }) => {
  const [aspectMode, setAspectMode] = React.useState<"9:16" | "16:9">("9:16");
  const [fitMode, setFitMode] = React.useState<"cover" | "contain">("cover");
  const [rotation, setRotation] = React.useState(0);
  const {
    streamMode, setStreamMode, streaming, camera, toggleCamera,
    listenAudio, setListenAudio, audioActive, talking, statusText,
    videoRef, audioRef, startStream, stopStream,
    handleTalkStart, handleTalkStop, speakerMode, toggleSpeakerMode,
  } = useWebRtcStream(deviceId, onSendCommand);

  const recorder = useStreamRecorder({ videoRef, audioRef, streamMode, childName, streaming });
  const isLandscape = aspectMode === "16:9";

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full min-h-0">
      {/* ── Video / Placeholder area ── */}
      <div data-dark-surface="true" className={`relative snap-dark-surface flex-shrink-0 mx-auto lg:mx-0 rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center transition-all duration-300 ${
        streaming && streamMode === "video"
          ? isLandscape ? "w-full max-w-[560px] aspect-video" : "w-full max-w-[300px] sm:max-w-[320px] aspect-[9/16] max-h-[580px]"
          : "w-full max-w-[340px] lg:max-w-[280px] aspect-[9/16] max-h-[440px]"
      }`}>
        <video
          ref={videoRef} autoPlay playsInline muted
          style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
          onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).play().catch(() => {}); }}
          className={`w-full h-full ${fitMode === "contain" ? "object-contain" : "object-cover"} ${streaming && streamMode === "video" ? "block" : "hidden"}`}
        />
        <audio ref={audioRef} autoPlay playsInline />

        {streaming && streamMode === "audio" && <LiveAudioVisualizer audioActive={audioActive} audioRef={audioRef} />}
        {!streaming && <LiveStreamPlaceholder streamMode={streamMode} isOnline={isOnline} onStart={() => startStream(streamMode)} />}

        {/* LIVE badge overlay */}
        {streaming && (
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none" data-dark-surface="true">
            <div data-dark-surface="true" className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-black/80 backdrop-blur-md border border-white/10">
              <span className={`w-2 h-2 rounded-full ${recorder.isRecording ? "bg-red-500 animate-pulse" : "bg-red-500 animate-ping"}`} />
              <span className="font-bold text-white text-[10px] tracking-wider uppercase">{recorder.isRecording ? "REC • Live" : "Live"}</span>
              <span className="text-white/60 text-[10px]">•</span>
              <span className="text-emerald-400 font-mono text-[10px] truncate max-w-[90px]">{statusText}</span>
            </div>
            {streamMode === "video" && (
              <span data-dark-surface="true" className="text-[10px] font-mono py-0.5 px-1.5 rounded-lg bg-black/80 text-[#FFFC00] border border-white/10">
                {camera.toUpperCase()} • {aspectMode}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Controls sidebar / bottom bar ── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Mode selector — only when not streaming */}
        {!streaming && (
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 w-full">
            <button
              onClick={() => setStreamMode("video")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                streamMode === "video" ? "bg-[#FFFC00] text-black shadow-md" : "text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Video className="w-3.5 h-3.5 shrink-0" />
              <span>Camera + Audio</span>
            </button>
            <button
              onClick={() => setStreamMode("audio")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                streamMode === "audio" ? "bg-[#FFFC00] text-black shadow-md" : "text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Audio-Only</span>
              <span className="sm:hidden">Audio</span>
            </button>
          </div>
        )}

        {/* Control buttons — when streaming */}
        {streaming && (
          <div className="flex flex-col gap-2">
            {/* Stream recording direct to admin device */}
            <StreamRecordControl
              isRecording={recorder.isRecording}
              duration={recorder.duration}
              lastSaved={recorder.lastSaved}
              streamMode={streamMode}
              onStart={recorder.startRecording}
              onStop={recorder.stopRecording}
            />

            {/* Row 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
              <button
                onClick={() => setListenAudio(!listenAudio)}
                className={`py-2 px-3 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  listenAudio ? "bg-[#FFFC00]/15 border-[#FFFC00]/30 text-[#FFFC00]" : "bg-white/5 border-white/10 text-white/50"
                }`}
              >
                {listenAudio ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                {listenAudio ? "Audio On" : "Muted"}
              </button>

              <button
                onClick={toggleSpeakerMode}
                className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                  speakerMode === "speaker" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-white/60"
                }`}
              >
                {speakerMode === "speaker" ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                {speakerMode === "speaker" ? "Loud Spk" : "Earpiece"}
              </button>

              {streamMode === "video" && (
                <>
                  <button onClick={toggleCamera} className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5">
                    <SwitchCamera className="w-3.5 h-3.5" /> Flip {camera === "front" ? "Back" : "Front"}
                  </button>
                  <button onClick={() => { const next = aspectMode === "9:16" ? "16:9" : "9:16"; setAspectMode(next); onSendCommand("webrtc_stream", { action: "set_orientation", orientation: next === "16:9" ? "landscape" : "portrait" }, `Set ${next}`); }} className={`py-2 px-3 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${isLandscape ? "bg-[#FFFC00]/15 border-[#FFFC00]/30 text-[#FFFC00]" : "bg-white/5 border-white/10 text-white/80"}`}>
                    <Maximize2 className="w-3.5 h-3.5" /> {aspectMode}
                  </button>
                  <button onClick={() => setFitMode(f => f === "cover" ? "contain" : "cover")} className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5">
                    {fitMode === "cover" ? "Fill (Cover)" : "Fit (Contain)"}
                  </button>
                  <button onClick={() => setRotation(r => (r + 90) % 360)} className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5" title="Rotate 90 degrees">
                    <RotateCw className="w-3.5 h-3.5" /> Rotate {rotation ? `${rotation}°` : ""}
                  </button>
                </>
              )}
            </div>

            {/* Row 2: Walkie-talkie + Stop */}
            <div className="flex items-center gap-2">
              <button
                onMouseDown={handleTalkStart} onMouseUp={handleTalkStop}
                onMouseLeave={handleTalkStop} onTouchStart={handleTalkStart}
                onTouchEnd={handleTalkStop} onTouchCancel={handleTalkStop}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border transition-all select-none flex items-center justify-center gap-2 ${
                  talking ? "bg-red-500 text-white border-red-400 scale-[0.98] shadow-lg shadow-red-500/20 animate-pulse" : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
                }`}
              >
                <Mic className="w-4 h-4" />
                {talking ? "Transmitting..." : "Hold to Talk"}
              </button>
              <button
                onClick={stopStream}
                className="py-3 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                <Square className="w-3.5 h-3.5 fill-red-400" />
                Stop
              </button>
            </div>
          </div>
        )}

        {/* Connection quality pill */}
        <div className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl border text-[10px] font-mono w-fit ${
          isOnline ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isOnline ? "Device Online" : "Device Offline"}
        </div>
      </div>
    </div>
  );
};
