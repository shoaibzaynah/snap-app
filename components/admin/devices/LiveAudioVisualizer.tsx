// components/admin/devices/LiveAudioVisualizer.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Radio } from "lucide-react";

interface Props {
  audioActive?: boolean;
  audioRef?: React.RefObject<HTMLAudioElement>;
}

export const LiveAudioVisualizer: React.FC<Props> = ({ audioActive, audioRef }) => {
  const [volume, setVolume] = useState<number[]>([20, 30, 25, 35, 20, 40, 25, 30, 20]);
  const animRef = useRef<number>();

  useEffect(() => {
    if (!audioActive || !audioRef?.current) return;
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaElementAudioSourceNode | null = null;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass && audioRef.current.srcObject) {
        audioCtx = new AudioContextClass();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 32;
        const mediaStream = audioRef.current.srcObject as MediaStream;
        const streamSource = audioCtx.createMediaStreamSource(mediaStream);
        streamSource.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const update = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          const slices = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((idx) => {
            const val = dataArray[idx] || 0;
            return Math.max(12, Math.min(60, Math.round((val / 255) * 60)));
          });
          setVolume(slices);
          animRef.current = requestAnimationFrame(update);
        };
        update();
      }
    } catch {}

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (audioCtx && audioCtx.state !== "closed") audioCtx.close().catch(() => {});
    };
  }, [audioActive, audioRef]);

  return (
    <div className="text-center p-8 space-y-4">
      <div className="w-20 h-20 rounded-full bg-[#FFFC00]/10 border-2 border-[#FFFC00] flex items-center justify-center mx-auto text-[#FFFC00] shadow-[0_0_30px_rgba(255,252,0,0.3)] animate-pulse">
        <Radio className="w-10 h-10" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-white">Live Microphone Stream Active</h4>
        <p className="text-xs text-white/50 mt-1">
          {audioActive ? "Receiving live sound from child device." : "Connecting to microphone..."}
        </p>
      </div>
      <div className="flex items-center justify-center gap-1.5 pt-2 h-16">
        {volume.map((h, i) => (
          <span
            key={i}
            className="w-1.5 bg-[#FFFC00] rounded-full transition-all duration-75"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
    </div>
  );
};
