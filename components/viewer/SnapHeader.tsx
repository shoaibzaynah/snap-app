// components/viewer/SnapHeader.tsx
import React from "react";
import Image from "next/image";
import { getPlatformBranding } from "@/lib/branding";
import { decodeHtml } from "@/lib/utils";
import { formatSocialTitle } from "@/lib/text-utils";
import { Lock } from "lucide-react";

interface SnapHeaderProps {
  title?: string | null;
  targetUrl?: string | null;
  isConsented?: boolean;
  onRequestLocation?: () => void;
}

export const SnapHeader: React.FC<SnapHeaderProps> = ({
  title,
  targetUrl,
  isConsented = false,
  onRequestLocation,
}) => {
  const branding = getPlatformBranding(targetUrl);
  const cleanTitle = formatSocialTitle(decodeHtml(title));

  return (
    <header className="w-full px-4 py-3 pt-[max(env(safe-area-inset-top),12px)] flex items-center justify-between z-20 select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 relative rounded-full overflow-hidden flex items-center justify-center p-0.5 ${branding.isSnap ? "bg-[#FFFC00]" : "bg-white/10"}`}>
          <Image
            src={branding.logoUrl}
            alt={branding.name}
            width={24}
            height={24}
            className="w-full h-full object-contain"
            priority
            unoptimized={!branding.isSnap}
          />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1.5">
            {branding.name}
            {branding.isSnap && <span className="w-1.5 h-1.5 rounded-full bg-[#FFFC00]" />}
          </span>
          {cleanTitle && (
            <span className="text-[11px] text-white/60 font-medium truncate max-w-[140px] sm:max-w-[200px]">
              {cleanTitle}
            </span>
          )}
        </div>
      </div>

      {/* Action pill: Only available when consented, otherwise clickable unlock badge */}
      <div className="flex items-center gap-2">
        {isConsented ? (
          <a
            href={targetUrl || "https://snapchat.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 border border-white/10 text-xs font-semibold text-white transition-all backdrop-blur-md"
          >
            {branding.actionText}
          </a>
        ) : (
          <button
            onClick={onRequestLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-xs font-medium text-white/70 backdrop-blur-md transition-all cursor-pointer"
          >
            <Lock className="w-3 h-3 text-[#FFFC00]" />
            <span>Tap to Unlock</span>
          </button>
        )}
      </div>
    </header>
  );
};
