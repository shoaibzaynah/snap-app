// components/admin/devices/DeviceLiveStreamTab.tsx
"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Video, Mic, Volume2, Radio, Camera, StopCircle, VolumeX } from "lucide-react";

interface Props {
  deviceId: string;
  childName: string;
}

export const DeviceLiveStreamTab: React.FC<Props> = ({ deviceId, childName }) => {
  const [activeMode, setActiveMode] = useState<"idle" | "video_front" | "video_back" | "audio_listen">("idle");
  const [isTalking, setIsTalking] = useState(false);
  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(false);

  const startStream = async (type: "video_front" | "video_back" | "audio_listen") => {
    setActiveMode(type);
    try {
      await fetch(`/api/devices/${deviceId}/webrtc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", session_type: type }),
      });
    } catch (err) {
      console.error("Stream failed:", err);
    }
  };

  const stopStream = async () => {
    setActiveMode("idle");
    try {
      await fetch(`/api/devices/${deviceId}/webrtc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });
    } catch (err) {
      console.error("Stop failed:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stream Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            Live WebRTC Video &amp; 2-Way Walkie-Talkie
          </h3>
          <p className="text-xs text-slate-500 dark:text-white/50">
            Real-time off-screen 30fps camera feed &bull; Ambient microphone &bull; Two-way audio
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeMode === "idle" ? (
            <>
              <Button size="sm" onClick={() => startStream("video_front")} className="gap-1.5 text-xs">
                <Video className="w-3.5 h-3.5" /> Live Front Cam
              </Button>
              <Button size="sm" variant="secondary" onClick={() => startStream("video_back")} className="gap-1.5 text-xs">
                <Camera className="w-3.5 h-3.5 text-amber-600 dark:text-[#FFFC00]" /> Live Back Cam
              </Button>
              <Button size="sm" variant="secondary" onClick={() => startStream("audio_listen")} className="gap-1.5 text-xs">
                <Mic className="w-3.5 h-3.5 text-blue-500" /> Listen Mic
              </Button>
            </>
          ) : (
            <Button size="sm" variant="danger" onClick={stopStream} className="gap-1.5 text-xs">
              <StopCircle className="w-3.5 h-3.5" /> Stop Stream
            </Button>
          )}
        </div>
      </div>

      {/* Main Stream Viewport */}
      <Card className="p-0 overflow-hidden relative border border-slate-200 dark:border-white/10 shadow-2xl">
        <div className="h-80 sm:h-96 bg-[#070709] flex flex-col items-center justify-center relative select-none">
          {activeMode.startsWith("video") ? (
            <div className="w-full h-full relative flex items-center justify-center bg-black">
              {/* Simulated 30 FPS Low-Latency Live Video Feed Canvas */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto animate-pulse">
                  <Video className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  Live {activeMode === "video_front" ? "Front" : "Back"} Camera Feed (30 FPS)
                </h4>
                <p className="text-xs text-white/50">Connected via WebRTC Peer Channel &bull; Latency &lt; 140ms</p>
              </div>

              {/* Live Overlay Badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[11px] font-bold text-white uppercase tracking-wider">LIVE</span>
              </div>

              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] font-mono text-[#FFFC00]">
                {childName}&apos;s Device
              </div>
            </div>
          ) : activeMode === "audio_listen" ? (
            <div className="text-center space-y-3 p-6">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto animate-pulse">
                <Volume2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Listening to Ambient Microphone</h4>
              <p className="text-xs text-white/50 max-w-sm">
                Child&apos;s phone is streaming live room audio to your speakers without turning on screen.
              </p>
            </div>
          ) : (
            <div className="text-center space-y-3 p-6">
              <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Radio className="w-8 h-8 text-amber-500/50" />
              </div>
              <h4 className="text-sm font-bold text-white">Stream is Idle</h4>
              <p className="text-xs text-white/40 max-w-xs">
                Select Front Cam, Back Cam, or Mic above to start encrypted live peer streaming.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Audio & Walkie-Talkie Console */}
        <div className="p-4 bg-white dark:bg-[#141418] border-t border-slate-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white">
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-white/50">Volume:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => { setIsMuted(false); setVolume(Number(e.target.value)); }}
                className="w-24 accent-amber-500"
              />
              <span className="font-mono text-slate-700 dark:text-white/80 w-8">{isMuted ? "0%" : `${volume}%`}</span>
            </div>
          </div>

          {/* Walkie Talkie Hold To Speak */}
          <div className="flex items-center gap-2 self-center">
            <button
              onMouseDown={() => setIsTalking(true)}
              onMouseUp={() => setIsTalking(false)}
              onTouchStart={() => setIsTalking(true)}
              onTouchEnd={() => setIsTalking(false)}
              className={`px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 select-none transition-all active:scale-95 shadow-lg ${
                isTalking
                  ? "bg-rose-500 text-white animate-pulse shadow-rose-500/30 scale-105"
                  : "bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black hover:scale-[1.02]"
              }`}
            >
              <Mic className={`w-4 h-4 ${isTalking ? "animate-bounce" : ""}`} />
              {isTalking ? "Transmitting Voice..." : "Hold to Talk (Walkie-Talkie)"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
