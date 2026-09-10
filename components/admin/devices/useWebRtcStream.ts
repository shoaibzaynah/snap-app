// components/admin/devices/useWebRtcStream.ts
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const ICE_SERVERS = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun.cloudflare.com:3478"] },
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
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
  const talkTrackRef = useRef<MediaStreamTrack | null>(null);

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
    talkTrackRef.current = null;
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

      let reconnectTimer: any = null;
      pc.ontrack = (e) => {
        const stream = e.streams?.[0] ?? new MediaStream([e.track]);
        if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
        setStatusText("P2P Live (<150ms)");
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

      pc.onicecandidate = (e) => { if (e.candidate) postSignal({ type: "candidate", candidate: e.candidate.toJSON(), sender: "admin" }); };
      pc.onconnectionstatechange = () => { if (pc.connectionState === "connected") { if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; } setStatusText("P2P Live (<150ms)"); } };
      pc.oniceconnectionstatechange = () => {
        const s = pc.iceConnectionState;
        if (s === "connected" || s === "completed") { if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; } setStatusText("P2P Live (<150ms)"); }
        else if (s === "failed") { setStatusText("Reconnecting..."); try { (pc as any).restartIce?.(); } catch {} }
      };

      channelRef.current = createClient().channel(`webrtc:${deviceId}`)
        .on("broadcast", { event: "signal" }, async ({ payload }) => {
          if (!payload || payload.sender !== "device" || !pcRef.current) return;
          try {
            if (payload.type === "answer" && payload.sdp && pcRef.current.signalingState === "have-local-offer") {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: payload.sdp }));
              setStatusText("Handshake complete...");
            } else if (payload.type === "candidate" && payload.candidate) {
              const c = payload.candidate;
              await pcRef.current.addIceCandidate(new RTCIceCandidate(typeof c === "string" ? { candidate: c } : c));
            }
          } catch (err) { console.warn("Signal error:", err); }
        }).subscribe();

      let micTrack: MediaStreamTrack | null = null;
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        talkStreamRef.current = localStream;
        micTrack = localStream.getAudioTracks()[0] || null;
        if (micTrack) { micTrack.enabled = false; talkTrackRef.current = micTrack; pc.addTrack(micTrack, localStream); }
      } catch { pc.addTransceiver("audio", { direction: "recvonly" }); }
      if (!micTrack) { try { pc.addTransceiver("audio", { direction: "recvonly" }); } catch {} }
      if (mode === "video") pc.addTransceiver("video", { direction: "recvonly" });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((res) => {
        if (pc.iceGatheringState === "complete") return res();
        const done = () => { if (pc.iceGatheringState === "complete") { pc.removeEventListener("icegatheringstatechange", done); res(); } };
        pc.addEventListener("icegatheringstatechange", done);
        setTimeout(() => { pc.removeEventListener("icegatheringstatechange", done); res(); }, 1500);
      });

      const offerSdp = pc.localDescription?.sdp || offer.sdp;
      postSignal({ type: "offer", sdp: offerSdp, sender: "admin", mode });
      onSendCommand("webrtc_stream", {
        action: "start", mode, front: camera === "front", video: mode === "video", audio: true, sdp: offerSdp,
      }, mode === "video" ? "Live Video Start" : "Live Audio Start");

      let pollAttempts = 0;
      pollRef.current = setInterval(async () => {
        if (!pcRef.current || pollAttempts++ > 25) {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          return;
        }
        if (pcRef.current.iceConnectionState === "connected" || pcRef.current.iceConnectionState === "completed") {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          return;
        }
        try {
          const res = await fetch(`/api/devices/${deviceId}/signaling?_t=${Date.now()}`);
          if (!res.ok) return;
          const data = await res.json();
          const ans = data?.session?.sdp_answer;
          if (ans?.sdp && pcRef.current?.signalingState === "have-local-offer") {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: ans.sdp }));
            setStatusText("Handshake complete...");
          }
          if (Array.isArray(data?.session?.ice_candidates)) {
            for (const item of data.session.ice_candidates) {
              if (item.sender === "device" && item.candidate) {
                try { const c = item.candidate; await pcRef.current?.addIceCandidate(new RTCIceCandidate(typeof c === "string" ? { candidate: c } : c)); } catch {}
              }
            }
          }
        } catch {}
      }, 1200);
    } catch (err) {
      console.error("WebRTC start error:", err);
      setStatusText("Connection error"); setStreaming(false);
    }
  };

  const toggleCamera = () => {
    const next = camera === "front" ? "back" : "front"; setCamera(next);
    if (streaming && streamMode === "video") onSendCommand("webrtc_stream", { action: "switch_camera" }, "Flip Camera");
  };

  const handleTalkStart = () => {
    if (talkTrackRef.current) { talkTrackRef.current.enabled = true; setTalking(true); }
    else {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((st) => {
        talkStreamRef.current = st; const tr = st.getAudioTracks()[0];
        if (tr && pcRef.current) { talkTrackRef.current = tr; pcRef.current.addTrack(tr, st); setTalking(true); }
      }).catch(() => setTalking(false));
    }
  };

  const handleTalkStop = () => { if (talkTrackRef.current) talkTrackRef.current.enabled = false; setTalking(false); };
  useEffect(() => () => { if (streaming) stopStream(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    streamMode, setStreamMode, streaming, camera, toggleCamera, listenAudio, setListenAudio,
    audioActive, talking, statusText, videoRef, audioRef, startStream, stopStream, handleTalkStart, handleTalkStop,
  };
}
