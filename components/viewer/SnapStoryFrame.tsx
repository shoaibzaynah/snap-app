import React, { useState } from "react";
import Image from "next/image";
import { Avatar } from "@/components/ui/Avatar";
import { Volume2, VolumeX } from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface SnapStoryFrameProps {
  imageUrl: string;
  title?: string | null;
  createdAt?: string;
}

export const SnapStoryFrame: React.FC<SnapStoryFrameProps> = ({ imageUrl, title, createdAt }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [imgSrc, setImgSrc] = useState(imageUrl);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0A0A0C] border border-white/10 shadow-2xl flex flex-col justify-between select-none">
      {/* Top Segmented Story Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-3 flex gap-1.5">
        <div className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full w-full transition-all duration-300" />
        </div>
      </div>

      {/* Top Story Info Bar */}
      <div className="absolute top-5 left-0 right-0 z-30 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
          <Avatar name="Snap Story" size="sm" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-wide">
              {title || "Shared Snap"}
            </span>
            <span className="text-[10px] text-white/70 font-medium">
              {createdAt ? timeAgo(createdAt) : "Just now"}
            </span>
          </div>
        </div>

        {/* Audio Mute/Unmute Toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-90"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Snap Media Viewport */}
      <div className="relative w-full h-full flex items-center justify-center bg-[#070709] overflow-hidden">
        {!hasError ? (
          <Image
            src={imgSrc}
            alt={title || "Protected Snap"}
            fill
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-contain sm:object-cover"
            priority
            unoptimized
            onError={() => {
              if (imgSrc.includes("/api/image?path=")) {
                try {
                  const p = new URL(imgSrc, "http://localhost").searchParams.get("path");
                  if (p) {
                    setImgSrc(`https://gwbzbvlmxccajleedtze.supabase.co/storage/v1/object/public/snap-images/${p}`);
                    return;
                  }
                } catch {}
              }
              setHasError(true);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-white/60">
            <span className="text-4xl mb-2">📷</span>
            <p className="text-xs font-semibold">Image Loaded or Unavailable</p>
          </div>
        )}
        {/* Subtle vignette gradient for story look */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
      </div>
    </div>
  );
};
