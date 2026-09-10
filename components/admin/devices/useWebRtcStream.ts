// components/admin/devices/useWebRtcStream.ts
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ICE_SERVERS, flushCandidates } from "./webrtcConfig";

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
  const [speakerMode, setSpeakerMode] = useState<"speaker" | "earpiece">("speaker");

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const talkStreamRef = useRef<MediaStream | null>(null);
  const talkTrackRef = useRef<MediaStreamTrack | null>(null);
  const listenAudioRef = useRef(listenAudio);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  listenAudioRef.current = listenAudio;

  const postSignal = useCallback((body: Record<string, any>) =>
    fetch(`/api/devices/${deviceId}/signaling`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }), [deviceId]);

  useEffect(() => {
    if (audioRef.current) { audioRef.current.muted = !listenAudio; audioRef.current.volume = listenAudio ? 1.0 : 0; }
  }, [listenAudio]);

  const forcePlayAudio = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = !listenAudioRef.current; el.volume = listenAudioRef.current ? 1.0 : 0; el.play().catch(() => {});
    setTimeout(() => { if (!el) return; el.muted = !listenAudioRef.current; el.volume = listenAudioRef.current ? 1.0 : 0; el.play().catch(() => {}); }, 500);
  }, []);

  const stopStream = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (talkStreamRef.current) { talkStreamRef.current.getTracks().forEach(t => t.stop()); talkStreamRef.current = null; }
    talkTrackRef.current = null;
    pendingCandidatesRef.current = [];
    remoteDescSetRef.current = false;
    sessionIdRef.current = null;
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (channelRef.current) { try { createClient().removeChannel(channelRef.current); } catch {} channelRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    setStreaming(false); setAudioActive(false); setTalking(false); setStatusText("Stream Stopped");
    onSendCommand("webrtc_stream", { action: "stop" }, "Stop Stream");
  }, [onSendCommand]);

  /** Called when answer arrives — sets remote desc and flushes buffered ICE */
  const applyAnswer = useCallback(async (sdp: string) => {
    const pc = pcRef.current;
    if (!pc || pc.signalingState !== "have-local-offer") return;
    if (remoteDescSetRef.current) return; // already applied
    try {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp }));
      remoteDescSetRef.current = true;
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      await flushCandidates(pc, pendingCandidatesRef.current);
      pendingCandidatesRef.current = [];
      setStatusText("Handshake complete…");
    } catch (err) { console.warn("applyAnswer error:", err); }
  }, []);

  const startStream = async (mode = streamMode) => {
    setStatusText("Connecting to phone…"); setStreaming(true); setAudioActive(false);
    if (audioRef.current) { audioRef.current.muted = !listenAudio; audioRef.current.volume = listenAudio ? 1.0 : 0; audioRef.current.play().catch(() => {}); }

    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, iceCandidatePoolSize: 4 });
      pcRef.current = pc;

      pc.ontrack = (e) => {
        const stream = e.streams?.[0] ?? new MediaStream([e.track]);
        setStatusText("P2P Live (<150ms)");
        if (e.track.kind === "video" && mode === "video" && videoRef.current) {
          const vid = videoRef.current;
          vid.srcObject = stream; vid.muted = true;
          vid.play().catch(() => {});
          setTimeout(() => { vid.play().catch(() => {}); }, 400);
        }
        if (e.track.kind === "audio" && audioRef.current) {
          audioRef.current.srcObject = new MediaStream(stream.getAudioTracks());
          forcePlayAudio(); setAudioActive(true);
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) postSignal({ type: "candidate", candidate: e.candidate.toJSON(), sender: "admin" });
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") setStatusText("P2P Live (<150ms)");
        if (pc.connectionState === "failed") { setStatusText("Reconnecting…"); try { (pc as any).restartIce?.(); } catch {} }
      };
      pc.oniceconnectionstatechange = () => {
        const s = pc.iceConnectionState;
        if (s === "connected" || s === "completed") setStatusText("P2P Live (<150ms)");
        if (s === "failed") { setStatusText("ICE failed — retrying…"); try { (pc as any).restartIce?.(); } catch {} }
      };

      // Subscribe to Supabase broadcast FIRST before sending offer
      await new Promise<void>((resolve) => {
        const ch = createClient().channel(`webrtc:${deviceId}`);
        channelRef.current = ch;
        ch.on("broadcast", { event: "signal" }, async ({ payload }) => {
          if (!payload || payload.sender !== "device" || !pcRef.current) return;
          try {
            if (payload.type === "answer" && payload.sdp) {
              await applyAnswer(payload.sdp);
            } else if (payload.type === "candidate" && payload.candidate) {
              const init = typeof payload.candidate === "string" ? { candidate: payload.candidate } : payload.candidate;
              if (remoteDescSetRef.current && pcRef.current?.remoteDescription) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(init));
              } else {
                pendingCandidatesRef.current.push(init);
              }
            }
          } catch (err) { console.warn("Signal error:", err); }
        }).subscribe((status) => { if (status === "SUBSCRIBED") resolve(); });
        // Don't block if subscription takes too long
        setTimeout(resolve, 1500);
      });

      // Add tracks/transceivers
      let micTrack: MediaStreamTrack | null = null;
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        talkStreamRef.current = localStream;
        micTrack = localStream.getAudioTracks()[0] || null;
        if (micTrack) { micTrack.enabled = false; talkTrackRef.current = micTrack; pc.addTrack(micTrack, localStream); }
      } catch {
        try { pc.addTransceiver("audio", { direction: "recvonly" }); } catch {}
      }
      if (mode === "video") { try { pc.addTransceiver("video", { direction: "recvonly" }); } catch {} }

      // Create offer — wait up to 2s for ICE gathering
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await new Promise<void>((res) => {
        if (pc.iceGatheringState === "complete") return res();
        const done = () => { if (pc.iceGatheringState === "complete") { pc.removeEventListener("icegatheringstatechange", done); res(); } };
        pc.addEventListener("icegatheringstatechange", done);
        setTimeout(() => { pc.removeEventListener("icegatheringstatechange", done); res(); }, 2000);
      });

      const offerSdp = pc.localDescription?.sdp || offer.sdp;

      // Send offer to signaling API + command to device simultaneously
      await postSignal({ type: "offer", sdp: offerSdp, sender: "admin", mode });
      onSendCommand("webrtc_stream", {
        action: "start", mode, front: camera === "front", video: mode === "video", audio: true,
        sdp: offerSdp, speaker_mode: speakerMode,
      }, mode === "video" ? "Live Video" : "Live Audio");

      // Poll DB as fallback (in case Broadcast missed the answer)
      pollRef.current = setInterval(async () => {
        if (!pcRef.current || remoteDescSetRef.current) {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          return;
        }
        try {
          const res = await fetch(`/api/devices/${deviceId}/signaling?_t=${Date.now()}`);
          if (!res.ok) return;
          const data = await res.json();
          const ans = data?.session?.sdp_answer;
          if (ans?.sdp) await applyAnswer(ans.sdp);
        } catch {}
      }, 1500);

    } catch (err) {
      console.error("WebRTC start error:", err);
      setStatusText("Connection error"); setStreaming(false);
      pendingCandidatesRef.current = []; remoteDescSetRef.current = false;
    }
  };

  const toggleCamera = () => {
    const next = camera === "front" ? "back" : "front";
    setCamera(next);
    if (streaming && streamMode === "video") onSendCommand("webrtc_stream", { action: "switch_camera" }, "Flip Camera");
  };

  const toggleSpeakerMode = () => {
    const next = speakerMode === "speaker" ? "earpiece" : "speaker";
    setSpeakerMode(next);
    if (streaming) onSendCommand("webrtc_stream", { action: "set_audio_output", mode: next }, next === "speaker" ? "Loud Speaker" : "Earpiece");
  };

  const handleTalkStart = () => {
    if (talkTrackRef.current) { talkTrackRef.current.enabled = true; setTalking(true); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then((st) => {
      talkStreamRef.current = st;
      const tr = st.getAudioTracks()[0];
      if (tr && pcRef.current) { talkTrackRef.current = tr; pcRef.current.addTrack(tr, st); setTalking(true); }
    }).catch(() => { setTalking(false); });
  };

  const handleTalkStop = () => { if (talkTrackRef.current) talkTrackRef.current.enabled = false; setTalking(false); };

  useEffect(() => () => { if (streaming) stopStream(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    streamMode, setStreamMode, streaming, camera, toggleCamera, listenAudio, setListenAudio,
    audioActive, talking, statusText, videoRef, audioRef, startStream, stopStream,
    handleTalkStart, handleTalkStop, speakerMode, toggleSpeakerMode,
  };
}
