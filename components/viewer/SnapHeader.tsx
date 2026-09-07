// components/viewer/SnapHeader.tsx
import React from "react";
import Image from "next/image";
import { getPlatformBranding } from "@/lib/branding";

interface SnapHeaderProps {
  title?: string | null;
  targetUrl?: string | null;
}

export const SnapHeader: React.FC<SnapHeaderProps> = ({ title, targetUrl }) => {
  const branding = getPlatformBranding(targetUrl);

  return (
    <header className="w-full px-4 py-3 flex items-center justify-between z-20 select-none">
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
          {title && (
            <span className="text-[11px] text-white/60 font-medium truncate max-w-[140px] sm:max-w-[200px]">
              {title}
            </span>
          )}
        </div>
      </div>

      {/* Action pill matching platform */}
      <div className="flex items-center gap-2">
        <a
          href={targetUrl || "https://snapchat.com"}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 border border-white/10 text-xs font-semibold text-white transition-all backdrop-blur-md"
        >
          {branding.actionText}
        </a>
      </div>
    </header>
  );
};
