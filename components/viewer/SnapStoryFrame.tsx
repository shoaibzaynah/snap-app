/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Volume2, VolumeX } from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface SnapStoryFrameProps {
  imageUrl: string;
  fallbackUrl?: string;
  title?: string | null;
  createdAt?: string;
}

export const SnapStoryFrame: React.FC<SnapStoryFrameProps> = ({
  imageUrl,
  fallbackUrl,
  title,
  createdAt,
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [imgSrc, setImgSrc] = useState(imageUrl);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const triedFallback = useRef(false);

  useEffect(() => {
    setImgSrc(imageUrl);
    setIsLoading(true);
    setHasError(false);
    triedFallback.current = false;
  }, [imageUrl]);

  const handleImageError = () => {
    if (!triedFallback.current) {
      triedFallback.current = true;
      if (fallbackUrl && fallbackUrl !== imgSrc) {
        setImgSrc(fallbackUrl);
        return;
      }
      if (imgSrc.includes("supabase.co/storage")) {
        const match = imgSrc.match(/snap-images\/(.+)$/);
        if (match && match[1]) {
          setImgSrc(`/api/image?path=${encodeURIComponent(match[1])}`);
          return;
        }
      }
      if (imgSrc.includes("/api/image?path=")) {
        try {
          const p = new URL(imgSrc, "http://localhost").searchParams.get("path");
          if (p) {
            const base = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gwbzbvlmxccajleedtze.supabase.co";
            setImgSrc(`${base}/storage/v1/object/public/snap-images/${p}`);
            return;
          }
        } catch {}
      }
    }
    setHasError(true);
    setIsLoading(false);
  };

  return (
    <div className="relative w-full h-full flex-1 min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0A0A0C] border border-white/10 shadow-2xl flex flex-col justify-between select-none">
      {/* Top Segmented Story Progress Bar */}
      <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-3 flex gap-1.5 pointer-events-none">
        <div className="h-1 flex-1 bg-white/25 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full w-full transition-all duration-300" />
        </div>
      </div>

      {/* Top Story Info Bar */}
      <div className="absolute top-5 left-0 right-0 z-30 px-4 flex items-center justify-between pointer-events-auto">
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
      <div className="relative w-full h-full flex-1 min-h-0 flex items-center justify-center bg-[#070709] overflow-hidden">
        {/* Loading skeleton placeholder: zero black screen standard (Rule 17) */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#121216] animate-pulse">
            <div className="w-16 h-16 rounded-full bg-[#FFFC00]/10 flex items-center justify-center mb-3">
              <span className="text-3xl">👻</span>
            </div>
            <span className="text-xs font-semibold text-white/50 tracking-wider">Loading Snap...</span>
          </div>
        )}

        {!hasError ? (
          <>
            {/* Ambient blurred backdrop */}
            {imgSrc && (
              <div
                className="absolute inset-0 bg-cover bg-center blur-2xl opacity-25 scale-125 pointer-events-none"
                style={{ backgroundImage: `url("${imgSrc}")` }}
              />
            )}
            {/* Main high-resolution Snap image */}
            <img
              src={imgSrc}
              alt={title || "Protected Snap"}
              className={`relative z-10 w-full h-full max-h-full max-w-full object-contain pointer-events-none transition-opacity duration-300 ${
                isLoading ? "opacity-0" : "opacity-100"
              }`}
              onLoad={() => setIsLoading(false)}
              onError={handleImageError}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-white/60">
            <span className="text-4xl mb-2">📷</span>
            <p className="text-xs font-semibold">Snap Unavailable</p>
          </div>
        )}

        {/* Subtle vignette gradient for authentic Snapchat story look */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
      </div>
    </div>
  );
};
