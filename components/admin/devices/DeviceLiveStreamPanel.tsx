// components/admin/devices/DeviceLiveStreamPanel.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  // TURN relay — works on same WiFi, mobile data, and strict NAT
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];

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
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const talkStreamRef = useRef<MediaStream | null>(null);
  const talkSendersRef = useRef<RTCRtpSender[]>([]);

  const postSignal = useCallback((body: Record<string, any>) =>
    fetch(`/api/devices/${deviceId}/signaling`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }), [deviceId]);

  const startStream = async (mode = streamMode) => {
    setStatusText("Connecting to phone...");
    setStreaming(true);
    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      pc.ontrack = (e) => {
        const stream = e.streams?.[0] ?? new MediaStream([e.track]);
        if (e.track.kind === "video" && mode === "video" && videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        if (e.track.kind === "audio" && audioRef.current) {
          const audioStream = new MediaStream(stream.getAudioTracks());
          audioRef.current.srcObject = audioStream;
          audioRef.current.play().catch(() => {});
        }
        setStatusText("Live Feed Active (<150ms)");
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) postSignal({ type: "candidate", candidate: e.candidate.toJSON(), sender: "admin" });
      };

      pc.oniceconnectionstatechange = () => {
        const s = pc.iceConnectionState;
        if (s === "connected" || s === "completed") setStatusText("P2P Live (<150ms)");
        else if (s === "disconnected") setStatusText("Reconnecting...");
        else if (s === "failed") { setStatusText("Connection Failed"); stopStream(); }
      };

      // Subscribe to Realtime for WebRTC signaling
      const supabase = createClient();
      channelRef.current = supabase.channel(`webrtc:${deviceId}`)
        .on("broadcast", { event: "signal" }, async ({ payload }) => {
          if (!payload || payload.sender !== "device" || !pcRef.current) return;
          try {
            if (payload.type === "answer" && payload.sdp && pcRef.current.signalingState === "have-local-offer") {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: payload.sdp }));
              setStatusText("P2P Live (<150ms)");
              if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            } else if (payload.type === "candidate" && payload.candidate) {
              const c = payload.candidate;
              const iceCandidate = new RTCIceCandidate(typeof c === "string" ? { candidate: c } : c);
              await pcRef.current.addIceCandidate(iceCandidate);
            }
          } catch (err) { console.warn("Signal handling error:", err); }
        }).subscribe();

      // Add transceivers — audio starts as recvonly (no mic until user talks)
      if (mode === "video") pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send signaling + command to phone
      postSignal({ type: "offer", sdp: offer.sdp, sender: "admin", mode });
      onSendCommand("webrtc_stream", {
        action: "start", mode, front: camera === "front",
        video: mode === "video", audio: true, sdp: offer.sdp,
      }, mode === "video" ? "Live Video Start" : "Live Audio Start");

      // DB polling fallback for answer (in case Realtime misses)
      let connected = false;
      pollRef.current = setInterval(async () => {
        if (connected || !pcRef.current) return;
        try {
          const res = await fetch(`/api/devices/${deviceId}/signaling?_t=${Date.now()}`);
          if (!res.ok) return;
          const data = await res.json();
          const ans = data?.session?.sdp_answer;
          if (ans?.sdp && pcRef.current?.signalingState === "have-local-offer") {
            connected = true;
            await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: ans.sdp }));
            setStatusText("P2P Live (<150ms)");
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          }
        } catch {}
      }, 1500);
    } catch (err) {
      console.error("WebRTC start error:", err);
      setStatusText("Connection error");
      setStreaming(false);
    }
  };

  const stopStream = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (talkStreamRef.current) { talkStreamRef.current.getTracks().forEach(t => t.stop()); talkStreamRef.current = null; }
    talkSendersRef.current = [];
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (channelRef.current) { createClient().removeChannel(channelRef.current); channelRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    setStreaming(false);
    setTalking(false);
    setStatusText("Stream Stopped");
    onSendCommand("webrtc_stream", { action: "stop" }, "Stop Stream");
  }, [onSendCommand]);

  const toggleCamera = () => {
    const next = camera === "front" ? "back" : "front";
    setCamera(next);
    if (streaming && streamMode === "video") onSendCommand("webrtc_stream", { action: "switch_camera" }, "Flip Camera");
  };

  const handleTalkStart = async () => {
    if (!pcRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      talkStreamRef.current = stream;
      // Add tracks and store senders for cleanup
      const senders = stream.getAudioTracks().map(t => pcRef.current!.addTrack(t, stream));
      talkSendersRef.current = senders;
      setTalking(true);
    } catch { alert("Microphone permission required for 2-way talkback."); }
  };

  const handleTalkStop = () => {
    // Remove admin mic tracks from peer connection
    talkSendersRef.current.forEach(s => { try { pcRef.current?.removeTrack(s); } catch {} });
    talkSendersRef.current = [];
    if (talkStreamRef.current) { talkStreamRef.current.getTracks().forEach(t => t.stop()); talkStreamRef.current = null; }
    setTalking(false);
  };

  useEffect(() => () => { if (streaming) stopStream(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      {!streaming && (
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 w-fit">
          <button onClick={() => setStreamMode("video")} className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${streamMode === "video" ? "bg-[#FFFC00] text-black shadow-md" : "text-white/60 hover:text-white"}`}>
            <Video className="w-3.5 h-3.5" /> Live Camera + Audio
          </button>
          <button onClick={() => setStreamMode("audio")} className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${streamMode === "audio" ? "bg-[#FFFC00] text-black shadow-md" : "text-white/60 hover:text-white"}`}>
            <Volume2 className="w-3.5 h-3.5" /> Live Audio-Only (Zero Camera Load)
          </button>
        </div>
      )}

      <div className="relative w-full aspect-video max-h-[400px] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted={false} className={`w-full h-full object-contain ${streaming && streamMode === "video" ? "block" : "hidden"}`} />
        <audio ref={audioRef} autoPlay muted={false} className="hidden" />
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
        streaming={streaming} streamMode={streamMode} listenAudio={listenAudio}
        onToggleAudio={() => setListenAudio(!listenAudio)} camera={camera}
        onToggleCamera={toggleCamera} talking={talking} onTalkStart={handleTalkStart}
        onTalkStop={handleTalkStop} onStopStream={stopStream}
      />
    </div>
  );
};
