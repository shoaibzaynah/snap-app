// components/viewer/TargetRedirectFooter.tsx
"use client";

import React from "react";
import Image from "next/image";
import { getPlatformBranding } from "@/lib/branding";
import { MapPin, ShieldCheck, Share2 } from "lucide-react";

interface TargetRedirectFooterProps {
  targetUrl?: string | null;
  platform?: string | null;
  title?: string | null;
  isLocationActive?: boolean;
}

export const TargetRedirectFooter: React.FC<TargetRedirectFooterProps> = ({
  targetUrl,
  platform,
  title,
  isLocationActive = false,
}) => {
  const branding = getPlatformBranding(targetUrl, platform);

  let host = "";
  try {
    if (targetUrl) {
      const u = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
      host = u.hostname.replace(/^www\./, "");
    }
  } catch {
    host = branding.name.toLowerCase();
  }

  return (
    <footer className="w-full px-4 py-3 flex flex-col gap-2 z-20 select-none">

      {/* Target platform footer pill */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-white/70 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-white/10 p-0.5">
            <Image
              src={branding.faviconUrl}
              alt={branding.name}
              width={18}
              height={18}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-white truncate">{host || branding.name}</span>
            <span className="text-white/30">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400/90 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Destination
            </span>
          </div>
        </div>

        <button
          aria-label="Share Link"
          onClick={() => {
            if (typeof navigator !== "undefined" && navigator.share) {
              navigator.share({ title: title || branding.name, url: window.location.href }).catch(() => {});
            }
          }}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 active:scale-90 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-all shrink-0 ml-2"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
