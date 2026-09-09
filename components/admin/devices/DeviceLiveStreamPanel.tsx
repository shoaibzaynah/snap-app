// components/admin/devices/DeviceLiveStreamPanel.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Video, Volume2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LiveStreamControls } from "./LiveStreamControls";
import { LiveAudioVisualizer } from "./LiveAudioVisualizer";
import { LiveStreamPlaceholder } from "./LiveStreamPlaceholder";

interface Props {
  deviceId: string;
  childName: string;
  isOnline: boolean;
  onSendCommand: (cmd: string, payload?: any, label?: string) => void;
}

export const DeviceLiveStreamPanel: React.FC<Props> = ({ deviceId, childName, isOnline, onSendCommand }) => {
  const [streamMode, setStreamMode] = useState<"video" | "audio">("video");
  const [streaming, setStreaming] = useState(false);
  const [camera, setCamera] = useState<"front" | "back">("front");
  const [listenAudio, setListenAudio] = useState(true);
  const [talking, setTalking] = useState(false);
  const [statusText, setStatusText] = useState("Idle");

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);

  const startStream = async (mode = streamMode) => {
    setStatusText("Connecting to phone...");
    setStreaming(true);
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;

      pc.ontrack = (e) => {
        if (mode === "video" && videoRef.current && e.streams[0]) videoRef.current.srcObject = e.streams[0];
        if (audioRef.current && e.streams[0]) audioRef.current.srcObject = e.streams[0];
        setStatusText("Live Feed Active (<200ms)");
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          fetch(`/api/devices/${deviceId}/signaling`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "candidate", candidate: e.candidate, sender: "admin" }),
          });
        }
      };

      const supabase = createClient();
      const ch = supabase.channel(`webrtc:${deviceId}`)
        .on("broadcast", { event: "signal" }, async ({ payload }) => {
          if (!payload || payload.sender !== "device" || !pcRef.current) return;
          if (payload.type === "answer" && payload.sdp) {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: payload.sdp }));
            setStatusText("P2P Live (<200ms)");
          } else if (payload.type === "candidate" && payload.candidate) {
            const c = payload.candidate;
            await pcRef.current.addIceCandidate(new RTCIceCandidate(typeof c === "string" ? { candidate: c } : c));
          }
        })
        .subscribe();
      channelRef.current = ch;

      if (mode === "video") pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "sendrecv" });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      onSendCommand("webrtc_stream", {
        action: "start",
        mode,
        front: camera === "front",
        video: mode === "video",
        audio: listenAudio,
        sdp: offer.sdp,
      }, mode === "video" ? "Live Video Start" : "Live Audio Start");
    } catch {
      setStatusText("Connection error");
      setStreaming(false);
    }
  };

  const stopStream = () => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (channelRef.current) {
      createClient().removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    setStreaming(false);
    setTalking(false);
    setStatusText("Stream Stopped");
    onSendCommand("webrtc_stream", { action: "stop" }, "Stop Stream");
  };

  const toggleCamera = () => {
    const next = camera === "front" ? "back" : "front";
    setCamera(next);
    if (streaming && streamMode === "video") onSendCommand("webrtc_stream", { action: "switch_camera" }, "Flip Camera");
  };

  const handleTalkStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (pcRef.current) stream.getAudioTracks().forEach((t) => pcRef.current?.addTrack(t, stream));
      setTalking(true);
    } catch { alert("Microphone permission required for 2-way talkback."); }
  };

  useEffect(() => {
    return () => { if (streaming) stopStream(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {!streaming && (
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 w-fit">
          <button
            onClick={() => setStreamMode("video")}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              streamMode === "video" ? "bg-[#FFFC00] text-black shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            Live Camera + Audio
          </button>
          <button
            onClick={() => setStreamMode("audio")}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              streamMode === "audio" ? "bg-[#FFFC00] text-black shadow-md" : "text-white/60 hover:text-white"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            Live Audio-Only (Zero Camera Load)
          </button>
        </div>
      )}

      <div className="relative w-full aspect-video max-h-[400px] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted={!listenAudio} className={`w-full h-full object-contain ${streaming && streamMode === "video" ? "block" : "hidden"}`} />
        <audio ref={audioRef} autoPlay muted={!listenAudio} className="hidden" />

        {streaming && streamMode === "audio" && <LiveAudioVisualizer />}
        {!streaming && <LiveStreamPlaceholder streamMode={streamMode} isOnline={isOnline} onStart={() => startStream(streamMode)} />}

        {streaming && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold text-white uppercase text-[10px] tracking-wider">LIVE</span>
              <span className="text-white/40 text-[10px]">&bull;</span>
              <span className="text-emerald-400 font-mono text-[10px]">{statusText}</span>
            </div>
            {streamMode === "video" && (
              <span className="text-[10px] font-mono py-1 px-2 rounded-xl bg-black/80 text-[#FFFC00] border border-white/10">
                Cam: {camera.toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>

      <LiveStreamControls
        streaming={streaming}
        streamMode={streamMode}
        listenAudio={listenAudio}
        onToggleAudio={() => setListenAudio(!listenAudio)}
        camera={camera}
        onToggleCamera={toggleCamera}
        talking={talking}
        onTalkStart={handleTalkStart}
        onTalkStop={() => setTalking(false)}
        onStopStream={stopStream}
      />
    </div>
  );
};
