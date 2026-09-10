// components/admin/devices/useWebRtcStream.ts
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];

export function useWebRtcStream(
  deviceId: string,
  onSendCommand: (cmd: string, payload?: any, label?: string) => void
) {
  const [streamMode, setStreamMode] = useState<"video" | "audio">("video");
  const [streaming, setStreaming] = useState(false);
  const [camera, setCamera] = useState<"front" | "back">("front");
  const [listenAudio, setListenAudio] = useState(true);
  const [audioActive, setAudioActive] = useState(false);
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

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = !listenAudio;
  }, [listenAudio]);

  const stopStream = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (talkStreamRef.current) { talkStreamRef.current.getTracks().forEach(t => t.stop()); talkStreamRef.current = null; }
    talkSendersRef.current = [];
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (channelRef.current) { createClient().removeChannel(channelRef.current); channelRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    setStreaming(false);
    setAudioActive(false);
    setTalking(false);
    setStatusText("Stream Stopped");
    onSendCommand("webrtc_stream", { action: "stop" }, "Stop Stream");
  }, [onSendCommand]);

  const startStream = async (mode = streamMode) => {
    setStatusText("Connecting to phone...");
    setStreaming(true);
    setAudioActive(false);

    if (audioRef.current) {
      audioRef.current.muted = !listenAudio;
      audioRef.current.play().catch(() => {});
    }

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
          audioRef.current.srcObject = new MediaStream(stream.getAudioTracks());
          audioRef.current.muted = !listenAudio;
          audioRef.current.play().catch(() => {});
          setAudioActive(true);
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) postSignal({ type: "candidate", candidate: e.candidate.toJSON(), sender: "admin" });
      };

      pc.oniceconnectionstatechange = () => {
        const s = pc.iceConnectionState;
        if (s === "connected" || s === "completed") setStatusText("P2P Live (<150ms)");
        else if (s === "disconnected") setStatusText("Reconnecting...");
        else if (s === "failed") {
          setStatusText("Reconnecting...");
          try { (pc as any).restartIce?.(); } catch {}
        }
      };

      const supabase = createClient();
      channelRef.current = supabase.channel(`webrtc:${deviceId}`)
        .on("broadcast", { event: "signal" }, async ({ payload }) => {
          if (!payload || payload.sender !== "device" || !pcRef.current) return;
          try {
            if (payload.type === "answer" && payload.sdp && pcRef.current.signalingState === "have-local-offer") {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: payload.sdp }));
              setStatusText("Handshake complete...");
              if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            } else if (payload.type === "candidate" && payload.candidate) {
              const c = payload.candidate;
              await pcRef.current.addIceCandidate(new RTCIceCandidate(typeof c === "string" ? { candidate: c } : c));
            }
          } catch (err) { console.warn("Signal error:", err); }
        }).subscribe();

      if (mode === "video") pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((res) => {
        if (pc.iceGatheringState === "complete") return res();
        const done = () => { if (pc.iceGatheringState === "complete") { pc.removeEventListener("icegatheringstatechange", done); res(); } };
        pc.addEventListener("icegatheringstatechange", done);
        setTimeout(() => { pc.removeEventListener("icegatheringstatechange", done); res(); }, 1200);
      });

      const offerSdp = pc.localDescription?.sdp || offer.sdp;
      postSignal({ type: "offer", sdp: offerSdp, sender: "admin", mode });
      onSendCommand("webrtc_stream", {
        action: "start", mode, front: camera === "front",
        video: mode === "video", audio: true, sdp: offerSdp,
      }, mode === "video" ? "Live Video Start" : "Live Audio Start");

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
      talkSendersRef.current = stream.getAudioTracks().map(t => pcRef.current!.addTrack(t, stream));
      setTalking(true);
    } catch { alert("Microphone permission required for 2-way talkback."); }
  };

  const handleTalkStop = () => {
    talkSendersRef.current.forEach(s => { try { pcRef.current?.removeTrack(s); } catch {} });
    talkSendersRef.current = [];
    if (talkStreamRef.current) { talkStreamRef.current.getTracks().forEach(t => t.stop()); talkStreamRef.current = null; }
    setTalking(false);
  };

  useEffect(() => () => { if (streaming) stopStream(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    streamMode, setStreamMode, streaming, camera, toggleCamera, listenAudio, setListenAudio,
    audioActive, talking, statusText, videoRef, audioRef, startStream, stopStream, handleTalkStart, handleTalkStop,
  };
}
