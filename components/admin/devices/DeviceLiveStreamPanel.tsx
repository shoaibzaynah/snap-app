// components/admin/devices/DeviceLiveStreamPanel.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Video, Mic, MicOff, RefreshCw, SwitchCamera, Play, Square } from "lucide-react";

interface Props {
  deviceId: string;
  childName: string;
  isOnline: boolean;
  onSendCommand: (cmd: string, payload?: any, label?: string) => void;
}

export const DeviceLiveStreamPanel: React.FC<Props> = ({ deviceId, childName, isOnline, onSendCommand }) => {
  const [streaming, setStreaming] = useState(false);
  const [camera, setCamera] = useState<"front" | "back">("front");
  const [listenAudio, setListenAudio] = useState(true);
  const [talking, setTalking] = useState(false);
  const [statusText, setStatusText] = useState("Idle");

  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const startStream = async () => {
    setStatusText("Connecting to device...");
    setStreaming(true);

    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setStatusText("Live Feed Active (<250ms)");
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          fetch(`/api/devices/${deviceId}/signaling`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "candidate", candidate: e.candidate.candidate, sdpMLineIndex: e.candidate.sdpMLineIndex, sdpMid: e.candidate.sdpMid, sender: "admin" }),
          });
        }
      };

      // Add transceivers
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send start command to phone
      onSendCommand("webrtc_stream", { action: "start", front: camera === "front", video: true, audio: listenAudio, sdp: offer.sdp }, "Live Stream Start");
    } catch {
      setStatusText("Connection failed");
      setStreaming(false);
    }
  };

  const stopStream = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setStreaming(false);
    setTalking(false);
    setStatusText("Stream Stopped");
    onSendCommand("webrtc_stream", { action: "stop" }, "Stop Live Stream");
  };

  const toggleCamera = () => {
    const next = camera === "front" ? "back" : "front";
    setCamera(next);
    if (streaming) onSendCommand("webrtc_stream", { action: "switch_camera" }, "Switch Camera");
  };

  const handleTalkStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (pcRef.current) {
        stream.getAudioTracks().forEach((track) => pcRef.current?.addTrack(track, stream));
      }
      setTalking(true);
    } catch {
      alert("Microphone access required for two-way walkie-talkie.");
    }
  };

  const handleTalkStop = () => {
    setTalking(false);
  };

  useEffect(() => {
    return () => { if (streaming) stopStream(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {/* Viewport Frame */}
      <div className="relative w-full aspect-video max-h-[420px] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted={!listenAudio} className={`w-full h-full object-contain ${streaming ? "block" : "hidden"}`} />

        {!streaming && (
          <div className="text-center p-6 space-y-3">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#FFFC00]">
              <Video className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Live Camera & Audio Stream</h4>
              <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
                Direct WebRTC stream from {childName}&apos;s device. Zero database bandwidth, sub-second latency.
              </p>
            </div>
            <button
              onClick={startStream}
              disabled={!isOnline}
              className="py-2.5 px-5 rounded-2xl bg-[#FFFC00] text-black font-extrabold text-xs shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-black" />
              {isOnline ? "Start Live Feed" : "Device Offline"}
            </button>
          </div>
        )}

        {/* Live Overlay Badges */}
        {streaming && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold text-white uppercase text-[10px] tracking-wider">LIVE</span>
              <span className="text-white/40 text-[10px]">&bull;</span>
              <span className="text-emerald-400 font-mono text-[10px]">{statusText}</span>
            </div>
            <span className="text-[10px] font-mono py-1 px-2 rounded-xl bg-black/80 text-[#FFFC00] border border-white/10">
              Cam: {camera.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Control Bar */}
      {streaming && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setListenAudio(!listenAudio)}
              className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                listenAudio ? "bg-[#FFFC00]/15 border-[#FFFC00]/30 text-[#FFFC00]" : "bg-white/5 border-white/10 text-white/50"
              }`}
              title={listenAudio ? "Listen-In: Enabled" : "Listen-In: Muted"}
            >
              {listenAudio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              {listenAudio ? "Listening" : "Muted"}
            </button>

            <button
              onClick={toggleCamera}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <SwitchCamera className="w-4 h-4" />
              Flip to {camera === "front" ? "Back" : "Front"}
            </button>

            {/* Walkie-Talkie Push-to-Talk */}
            <button
              onMouseDown={handleTalkStart}
              onMouseUp={handleTalkStop}
              onTouchStart={handleTalkStart}
              onTouchEnd={handleTalkStop}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all select-none ${
                talking ? "bg-red-500 text-white border-red-400 scale-95 shadow-lg" : "bg-white/10 hover:bg-white/15 border-white/10 text-white"
              }`}
            >
              {talking ? "🎙️ Transmitting Voice..." : "Hold to Talk (Walkie-Talkie)"}
            </button>
          </div>

          <button
            onClick={stopStream}
            className="py-2 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
          >
            <Square className="w-3.5 h-3.5 fill-red-400" />
            Stop Feed
          </button>
        </div>
      )}
    </div>
  );
};
