// components/admin/devices/useWebRtcStream.ts
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ICE_SERVERS, flushCandidates, postSignal, setupPeerTracks } from "./webrtcConfig";

export function useWebRtcStream(
  deviceId: string,
  onSendCommand: (cmd: string, payload?: any, label?: string) => void
) {
  const [streamMode, setStreamMode] = useState<"video" | "audio">("video");
  const [streaming, setStreaming] = useState(false), [camera, setCamera] = useState<"front" | "back">("front");
  const [listenAudio, setListenAudio] = useState(true), [audioActive, setAudioActive] = useState(false);
  const [talking, setTalking] = useState(false), [statusText, setStatusText] = useState("Idle");
  const [speakerMode, setSpeakerMode] = useState<"speaker" | "earpiece">("speaker");

  const videoRef = useRef<HTMLVideoElement>(null), audioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null), channelRef = useRef<any>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null), talkStreamRef = useRef<MediaStream | null>(null);
  const talkTrackRef = useRef<MediaStreamTrack | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]), remoteDescSetRef = useRef(false);
  const appliedCandidatesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (audioRef.current) { audioRef.current.muted = !listenAudio; audioRef.current.volume = listenAudio ? 1.0 : 0; }
  }, [listenAudio]);

  const forcePlayAudio = useCallback(() => {
    const el = audioRef.current;
    if (el) { el.muted = !listenAudio; el.volume = listenAudio ? 1.0 : 0; el.play().catch(() => {}); }
  }, [listenAudio]);

  const addCandidateSafe = useCallback(async (init: RTCIceCandidateInit) => {
    const pc = pcRef.current;
    const candKey = `${init.candidate}|${init.sdpMid}|${init.sdpMLineIndex}`;
    if (appliedCandidatesRef.current.has(candKey)) return;
    appliedCandidatesRef.current.add(candKey);
    if (pc && remoteDescSetRef.current && pc.remoteDescription) {
      try { await pc.addIceCandidate(new RTCIceCandidate(init)); } catch {}
    } else { pendingCandidatesRef.current.push(init); }
  }, []);

  const applyAnswer = useCallback(async (sdp: string) => {
    const pc = pcRef.current;
    if (!pc || pc.signalingState !== "have-local-offer" || remoteDescSetRef.current) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp }));
      remoteDescSetRef.current = true;
      await flushCandidates(pc, pendingCandidatesRef.current);
      pendingCandidatesRef.current = [];
      setStatusText("Connecting media…");
    } catch (err) { console.warn("applyAnswer error:", err); }
  }, []);

  const stopStream = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (talkStreamRef.current) { talkStreamRef.current.getTracks().forEach(t => t.stop()); talkStreamRef.current = null; }
    talkTrackRef.current = null; pendingCandidatesRef.current = []; remoteDescSetRef.current = false;
    appliedCandidatesRef.current.clear();
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    if (channelRef.current) { try { createClient().removeChannel(channelRef.current); } catch {} channelRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    setStreaming(false); setAudioActive(false); setTalking(false); setStatusText("Stream Stopped");
    onSendCommand("webrtc_stream", { action: "stop" }, "Stop Stream");
  }, [onSendCommand]);

  const startStream = async (mode = streamMode) => {
    setStatusText("Connecting to phone…"); setStreaming(true); setAudioActive(false);
    appliedCandidatesRef.current.clear();
    if (audioRef.current) { audioRef.current.muted = !listenAudio; audioRef.current.volume = listenAudio ? 1.0 : 0; audioRef.current.play().catch(() => {}); }

    try {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, iceCandidatePoolSize: 4 });
      pcRef.current = pc;

      pc.ontrack = (e) => {
        const stream = e.streams?.[0] ?? new MediaStream([e.track]);
        setStatusText("P2P Live (<150ms)");
        if (e.track.kind === "video" && mode === "video" && videoRef.current) {
          const vid = videoRef.current; vid.srcObject = stream; vid.muted = true; vid.play().catch(() => {});
        }
        const audioTracks = stream.getAudioTracks();
        if ((e.track.kind === "audio" || audioTracks.length > 0) && audioRef.current) {
          audioRef.current.srcObject = new MediaStream(audioTracks.length > 0 ? audioTracks : [e.track]);
          forcePlayAudio(); setAudioActive(true);
        }
      };

      pc.onicecandidate = (e) => { if (e.candidate) postSignal(deviceId, { type: "candidate", candidate: e.candidate.toJSON(), sender: "admin" }); };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected" || pc.connectionState === "disconnected") { setStatusText("P2P Live (<150ms)"); if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }
        else if (pc.connectionState === "failed") { setStatusText("Reconnecting…"); setTimeout(() => { if (pcRef.current === pc && pc.connectionState === "failed") startStream(mode); }, 2500); }
      };
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") { setStatusText("P2P Live (<150ms)"); if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } }
      };

      const ch = createClient().channel(`webrtc:${deviceId}`);
      channelRef.current = ch;
      ch.on("broadcast", { event: "signal" }, async ({ payload }) => {
        if (!payload || payload.sender !== "device" || !pcRef.current) return;
        try {
          if (payload.type === "answer" && payload.sdp) await applyAnswer(payload.sdp);
          else if (payload.type === "candidate" && payload.candidate) {
            await addCandidateSafe(typeof payload.candidate === "string" ? { candidate: payload.candidate } : payload.candidate);
          }
        } catch {}
      }).subscribe();

      const tracks = await setupPeerTracks(pc, mode);
      talkStreamRef.current = tracks.talkStream; talkTrackRef.current = tracks.talkTrack;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((res) => {
        if (pc.iceGatheringState === "complete") return res();
        const done = () => { if (pc.iceGatheringState === "complete") { pc.removeEventListener("icegatheringstatechange", done); res(); } };
        pc.addEventListener("icegatheringstatechange", done);
        setTimeout(() => { pc.removeEventListener("icegatheringstatechange", done); res(); }, 1500);
      });

      const offerSdp = pc.localDescription?.sdp || offer.sdp;
      await postSignal(deviceId, { type: "offer", sdp: offerSdp, sender: "admin", mode });
      onSendCommand("webrtc_stream", {
        action: "start", mode, front: camera === "front", video: mode === "video", audio: true,
        sdp: offerSdp, speaker_mode: speakerMode,
      }, mode === "video" ? "Live Video" : "Live Audio");

      let pollCount = 0;
      pollRef.current = setInterval(async () => {
        pollCount++;
        if (!pcRef.current || pollCount > 25 || pcRef.current.connectionState === "connected") {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          return;
        }
        try {
          const res = await fetch(`/api/devices/${deviceId}/signaling?_t=${Date.now()}`);
          if (!res.ok) return;
          const { session } = await res.json();
          if (session?.sdp_answer?.sdp && !remoteDescSetRef.current) await applyAnswer(session.sdp_answer.sdp);
          if (Array.isArray(session?.ice_candidates)) {
            for (const item of session.ice_candidates) {
              if (item?.candidate && item?.sender !== "admin") {
                await addCandidateSafe(typeof item.candidate === "string" ? { candidate: item.candidate } : item.candidate);
              }
            }
          }
        } catch {}
      }, 1200);
    } catch (err) {
      console.error("WebRTC start error:", err); setStatusText("Connection error"); setStreaming(false);
    }
  };

  const toggleCamera = () => {
    const next = camera === "front" ? "back" : "front"; setCamera(next);
    if (streaming && streamMode === "video") onSendCommand("webrtc_stream", { action: "switch_camera" }, "Flip Camera");
  };

  const toggleSpeakerMode = () => {
    const next = speakerMode === "speaker" ? "earpiece" : "speaker"; setSpeakerMode(next);
    if (streaming) onSendCommand("webrtc_stream", { action: "set_audio_output", mode: next }, next === "speaker" ? "Loud Speaker" : "Earpiece");
  };

  const handleTalkStart = async () => {
    try {
      const pc = pcRef.current;
      if (!pc) return;
      onSendCommand("webrtc_stream", { action: "set_audio_output", mode: "speaker" });
      channelRef.current?.send({ type: "broadcast", event: "signal", payload: { type: "set_audio_output", mode: "speaker", sender: "admin" } });
      if (!talkTrackRef.current || talkTrackRef.current.readyState === "ended") {
        const st = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
        talkStreamRef.current = st;
        const tr = st.getAudioTracks()[0];
        if (tr) {
          talkTrackRef.current = tr;
          const sender = pc.getSenders().find(s => s.track?.kind === "audio" || (s as any).kind === "audio");
          if (sender) await sender.replaceTrack(tr); else pc.addTrack(tr, st);
        }
      }
      if (talkTrackRef.current) { talkTrackRef.current.enabled = true; setTalking(true); }
    } catch { setTalking(false); }
  };

  const handleTalkStop = () => { if (talkTrackRef.current) talkTrackRef.current.enabled = false; setTalking(false); };
  useEffect(() => () => { if (streaming) stopStream(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    streamMode, setStreamMode, streaming, camera, toggleCamera, listenAudio, setListenAudio,
    audioActive, talking, statusText, videoRef, audioRef, startStream, stopStream,
    handleTalkStart, handleTalkStop, speakerMode, toggleSpeakerMode,
  };
}
