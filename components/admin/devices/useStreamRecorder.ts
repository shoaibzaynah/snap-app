// components/admin/devices/useStreamRecorder.ts
// 100% Client-side local WebRTC recording directly to Admin device storage (0% cloud)
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "@/components/ui/Toast";
import { patchWebmDuration } from "@/lib/webm-fix";

interface UseStreamRecorderOptions {
  videoRef: React.RefObject<HTMLVideoElement>;
  audioRef: React.RefObject<HTMLAudioElement>;
  streamMode: "video" | "audio";
  childName?: string;
  streaming?: boolean;
}

function getBestMimeType(isVideo: boolean): string {
  if (typeof window === "undefined" || !window.MediaRecorder) return "";
  const videoTypes = [
    "video/mp4;codecs=avc1,mp4a.40.2",
    "video/mp4;codecs=h264,aac",
    "video/mp4",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
  ];
  const audioTypes = [
    "audio/mp4",
    "audio/aac",
    "audio/webm;codecs=opus",
    "audio/webm",
  ];
  const candidates = isVideo ? videoTypes : audioTypes;
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export function useStreamRecorder({
  videoRef,
  audioRef,
  streamMode,
  childName,
  streaming,
}: UseStreamRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  const triggerDownload = useCallback(async (chunks: Blob[], mimeType: string) => {
    if (!chunks.length) return;
    let blob = new Blob(chunks, { type: mimeType });
    const isVideo = streamMode === "video";
    const elapsedMs = Math.max(duration * 1000, Date.now() - startTimeRef.current);

    if (blob.type.includes("webm") && elapsedMs > 500) {
      blob = await patchWebmDuration(blob, elapsedMs);
    }

    const ext = isVideo
      ? (blob.type.includes("mp4") ? "mp4" : "webm")
      : (blob.type.includes("mp4") || blob.type.includes("m4a") ? "m4a" : "webm");
    const dateStr = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
    const cleanName = (childName || "snap").toLowerCase().replace(/[^a-z0-9]/g, "_");
    const filename = `${cleanName}_${streamMode}_${dateStr}.${ext}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);

    const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);
    setLastSaved(`${filename} (${sizeMb} MB)`);
    toast.success(`Saved: ${filename} (${sizeMb}MB)`);
    setTimeout(() => setLastSaved(null), 8000);
  }, [childName, duration, streamMode]);

  const startRecording = useCallback(() => {
    chunksRef.current = [];
    setDuration(0);
    startTimeRef.current = Date.now();
    const isVideo = streamMode === "video";
    const combined = new MediaStream();

    if (isVideo && videoRef.current?.srcObject) {
      const vStream = videoRef.current.srcObject as MediaStream;
      vStream.getVideoTracks().forEach((t) => combined.addTrack(t));
    }
    if (audioRef.current?.srcObject) {
      const aStream = audioRef.current.srcObject as MediaStream;
      aStream.getAudioTracks().forEach((t) => combined.addTrack(t));
    }

    if (!combined.getTracks().length) {
      toast.error("No active stream tracks to record");
      return;
    }

    recordingStreamRef.current = combined;
    const mimeType = getBestMimeType(isVideo);
    const options: MediaRecorderOptions = {
      mimeType: mimeType || undefined,
      audioBitsPerSecond: 128_000, // Studio-clear audio recording
      videoBitsPerSecond: isVideo ? 1_200_000 : undefined, // Crisp high-definition video recording
    };

    try {
      const recorder = new MediaRecorder(combined, options);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const activeMime = recorder.mimeType || mimeType || (isVideo ? "video/webm" : "audio/webm");
        triggerDownload(chunksRef.current, activeMime);
        chunksRef.current = [];
        setIsRecording(false);
      };

      recorder.start(1000); // 1-second timeslices
      setIsRecording(true);
      toast.info(`Recording ${streamMode} stream...`);

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Failed to start MediaRecorder:", err);
      toast.error(`Recording not supported: ${err?.message || err}`);
    }
  }, [audioRef, streamMode, triggerDownload, videoRef]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }, []);

  // Cleanup on unmount or stream stop
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
  }, []);

  // Auto-stop recording if live stream ends
  useEffect(() => {
    if (streaming === false && isRecording) {
      stopRecording();
    }
  }, [streaming, isRecording, stopRecording]);

  return {
    isRecording,
    duration,
    lastSaved,
    startRecording,
    stopRecording,
  };
}
