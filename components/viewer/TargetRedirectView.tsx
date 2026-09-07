// components/viewer/TargetRedirectView.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ImageLink } from "@/lib/types";
import { getPlatformBranding } from "@/lib/branding";
import { decodeHtml } from "@/lib/utils";
import { Play, ExternalLink, ShieldCheck, MapPin, AlertCircle, Lock } from "lucide-react";

interface TargetRedirectViewProps {
  link: ImageLink;
  isConsented: boolean;
  isLoading: boolean;
  error: string | null;
  onRequestLocation: () => void;
}

export const TargetRedirectView: React.FC<TargetRedirectViewProps> = ({
  link,
  isConsented,
  isLoading,
  error,
  onRequestLocation,
}) => {
  const [redirecting, setRedirecting] = useState(false);
  const targetUrl = link.target_url || "#";
  const previewImg = link.og_image_url || "/LOGO.svg";
  const cleanTitle = decodeHtml(link.og_title || link.title || "Exclusive Content");
  const cleanDescription = decodeHtml(link.og_description || link.description);
  const platform = link.og_platform || "custom";
  const branding = getPlatformBranding(link.target_url);

  // Trigger automatic redirect once location is consented and recorded
  useEffect(() => {
    if (isConsented && link.target_url) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        window.location.href = link.target_url!;
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isConsented, link.target_url]);

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-5 text-white">
      {/* Top Media / Thumbnail Preview */}
      <div className="space-y-4">
        <div
          onClick={!isConsented ? onRequestLocation : undefined}
          className={`relative w-full aspect-video rounded-3xl overflow-hidden bg-[#121216] border border-white/10 shadow-2xl ${
            !isConsented ? "cursor-pointer group" : ""
          }`}
        >
          {previewImg && (
            <Image
              src={previewImg}
              alt={cleanTitle}
              fill
              className={`object-cover transition-all duration-700 ${
                !isConsented
                  ? "blur-[3.5px] scale-[1.03] opacity-90"
                  : "blur-0 scale-100 opacity-100"
              }`}
              unoptimized
            />
          )}

          {/* Teaser Unlock Overlay when not yet consented */}
          {!isConsented ? (
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 transition-all duration-500">
              <div className="w-14 h-14 rounded-full bg-[#FFFC00] flex items-center justify-center text-black shadow-xl shadow-yellow-500/30 group-hover:scale-110 active:scale-95 transition-transform">
                <Play className="w-6 h-6 fill-black translate-x-0.5" />
              </div>
              <div className="mt-3 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-xs font-bold text-white border border-white/15 flex items-center gap-2 shadow-lg group-hover:bg-black/90 transition-colors">
                <Lock className="w-3.5 h-3.5 text-[#FFFC00]" />
                <span>Tap to Unlock Content</span>
              </div>
            </div>
          ) : (
            (platform === "youtube" || platform === "tiktok") && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-[#FFFC00] flex items-center justify-center text-black shadow-xl shadow-yellow-500/30">
                  <Play className="w-6 h-6 fill-black translate-x-0.5" />
                </div>
              </div>
            )
          )}

          {/* Platform pill badge */}
          {platform !== "custom" && (
            <div className="absolute top-3 left-3">
              <Badge variant="active" className="uppercase text-[10px] bg-black/80 backdrop-blur-md">
                {platform}
              </Badge>
            </div>
          )}
        </div>

        {/* Content Title & Description */}
        <div className="space-y-1.5 px-1">
          <h1 className="text-base sm:text-lg font-black text-white leading-snug">
            {cleanTitle}
          </h1>
          {cleanDescription && (
            <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
              {cleanDescription}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="space-y-3 pt-4">
        {error && (
          <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{error}</p>
              <p className="text-[10px] text-white/50 mt-0.5">Please allow location in browser settings to continue.</p>
            </div>
          </div>
        )}

        {redirecting ? (
          <div className="p-5 rounded-3xl bg-[#141418] border border-white/10 text-center space-y-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-full border-2 border-[#FFFC00] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-bold text-white">Opening {branding.name}...</p>
            <a
              href={targetUrl}
              className="inline-flex items-center gap-1.5 text-xs text-[#FFFC00] underline underline-offset-4"
            >
              Click here if not redirected automatically <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="p-4 rounded-3xl bg-[#141418] border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-[11px] text-white/70">
              <ShieldCheck className="w-4 h-4 text-[#FFFC00]" />
              <span>Location verification required to unlock & open {branding.name}</span>
            </div>

            <Button
              onClick={onRequestLocation}
              isLoading={isLoading}
              size="lg"
              className="w-full justify-center gap-2 font-black text-sm shadow-lg shadow-[#FFFC00]/20"
            >
              <MapPin className="w-4 h-4 fill-black" />
              Allow Location & Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
