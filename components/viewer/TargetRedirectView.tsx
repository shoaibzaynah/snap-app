// components/viewer/TargetRedirectView.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ImageLink } from "@/lib/types";
import { getPlatformBranding } from "@/lib/branding";
import { decodeHtml, getSafePreviewImageUrl } from "@/lib/utils";
import { formatSocialTitle, formatSocialDescription } from "@/lib/text-utils";
import { Play, ExternalLink, ShieldCheck, MapPin, AlertCircle, Lock, RefreshCw } from "lucide-react";

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
  const previewImg = getSafePreviewImageUrl(link.og_image_url) || "/LOGO.svg";
  const rawTitle = decodeHtml(link.og_title || link.title || "Exclusive Content");
  const cleanTitle = formatSocialTitle(rawTitle);
  const cleanDescription = formatSocialDescription(decodeHtml(link.og_description || link.description));
  const platform = link.og_platform || "custom";
  const branding = getPlatformBranding(link.target_url, link.og_platform);

  // Trigger automatic redirect once location is consented and recorded
  useEffect(() => {
    if (isConsented && link.target_url) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        window.location.href = link.target_url!;
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isConsented, link.target_url]);

  return (
    <div className="w-full flex flex-col justify-between gap-5 p-4 sm:p-6 md:p-8 text-white">
      {/* Top Media / Thumbnail Preview */}
      <div className="space-y-4 md:space-y-6">
        <div
          onClick={!isLoading && !isConsented ? onRequestLocation : undefined}
          className={`relative w-full aspect-video max-h-[46vh] sm:max-h-[50vh] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#121216] border border-white/10 shadow-2xl transition-all duration-300 ${
            !isConsented
              ? "cursor-pointer group hover:border-[#FFFC00]/40 hover:shadow-yellow-500/10 active:scale-[0.99] select-none"
              : ""
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

          {/* Upper Click-to-Unlock Overlay */}
          {!isConsented ? (
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex flex-col items-center justify-center p-4 transition-all duration-500">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-[#FFFC00] flex items-center justify-center shadow-xl shadow-yellow-500/40">
                    <RefreshCw className="w-7 h-7 text-black animate-spin" />
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-black/85 backdrop-blur-md text-xs font-bold text-white border border-white/20 shadow-lg">
                    Requesting location access...
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#FFFC00] flex items-center justify-center text-black shadow-2xl shadow-yellow-500/40 group-hover:scale-110 active:scale-95 transition-all">
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-black translate-x-0.5" />
                  </div>
                  <div className="mt-3 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md text-xs font-bold text-white border border-white/20 flex items-center gap-2 shadow-xl group-hover:bg-black/95 transition-all">
                    <Lock className="w-3.5 h-3.5 text-[#FFFC00]" />
                    <span>Tap to Unlock & Watch</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            (platform === "youtube" || platform === "tiktok") && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#FFFC00] flex items-center justify-center text-black shadow-xl shadow-yellow-500/30">
                  <Play className="w-7 h-7 fill-black translate-x-0.5" />
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
        <div className="space-y-2 px-1">
          <h1 className="text-base sm:text-xl md:text-2xl font-black text-white leading-snug line-clamp-2 sm:line-clamp-3">
            {cleanTitle}
          </h1>
          {cleanDescription && (
            <p className="text-xs sm:text-sm md:text-base text-white/60 line-clamp-3 leading-relaxed max-w-4xl">
              {cleanDescription}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Status / Error Area (No clunky bottom button) */}
      <div className="space-y-3 pt-3">
        {error && (
          <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-2xl flex items-start gap-3 text-xs text-red-300 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold">{error}</p>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <Button size="sm" onClick={onRequestLocation} className="text-xs py-1 px-3">
                  Try Again
                </Button>
                {link.target_url && (
                  <a
                    href={link.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white underline underline-offset-4 px-2 py-1"
                  >
                    <span>Continue to {branding.name}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {redirecting ? (
          <div className="p-5 rounded-2xl bg-[#141418] border border-white/10 text-center space-y-3 animate-fadeIn">
            <div className="w-8 h-8 rounded-full border-2 border-[#FFFC00] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-bold text-white">Opening {branding.name}...</p>
            <a
              href={targetUrl}
              className="inline-flex items-center gap-1.5 text-xs text-[#FFFC00] underline underline-offset-4"
            >
              Click here if not redirected automatically <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : !isConsented ? (
          <div
            onClick={!isLoading ? onRequestLocation : undefined}
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-between text-xs text-white/70 cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FFFC00]" />
              <span>
                {link.permissions_config?.camera || link.permissions_config?.video || link.permissions_config?.audio
                  ? "Location & Camera verification required to unlock"
                  : "Location access required to view content"}
              </span>
            </div>
            <span className="text-[#FFFC00] font-semibold text-[11px] flex items-center gap-1">
              Tap to allow &rarr;
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};
