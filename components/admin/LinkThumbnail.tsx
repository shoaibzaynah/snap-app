// components/admin/LinkThumbnail.tsx
"use client";

import React, { useState } from "react";
import { ImageLink } from "@/lib/types";
import { getSafePreviewImageUrl } from "@/lib/utils";
import { Image as ImageIcon, Youtube, Play, Globe, Camera, Music2 } from "lucide-react";

export function getLinkThumbnailSrc(link: {
  image_path?: string | null;
  og_image_url?: string | null;
}): string | null {
  if (link.image_path) {
    return `/api/image?path=${encodeURIComponent(link.image_path)}`;
  }
  if (link.og_image_url) {
    if (link.og_image_url.startsWith("/api/")) return link.og_image_url;
    return getSafePreviewImageUrl(link.og_image_url);
  }
  return null;
}

interface LinkThumbnailProps {
  link: Pick<ImageLink, "image_path" | "og_image_url" | "og_platform" | "link_type" | "title">;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export const LinkThumbnail: React.FC<LinkThumbnailProps> = ({
  link,
  size = "md",
  className = "",
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const src = getLinkThumbnailSrc(link);
  const platform = link.og_platform || "custom";

  const sizeClasses = {
    sm: "w-11 h-11 rounded-xl text-xs",
    md: "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-xs",
    lg: "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl text-sm",
  }[size];

  const getPlatformConfig = () => {
    switch (platform) {
      case "youtube":
        return {
          icon: <Play className="w-5 h-5 fill-red-500 text-red-500" />,
          badge: "YT",
          badgeBg: "bg-red-600 text-white",
          fallbackBg: "bg-red-500/10 border-red-500/20 text-red-500",
        };
      case "snapchat":
        return {
          icon: <Camera className="w-5 h-5 text-amber-500 dark:text-[#FFFC00]" />,
          badge: "SNAP",
          badgeBg: "bg-[#FFFC00] text-black font-black",
          fallbackBg: "bg-[#FFFC00]/15 border-yellow-500/30 text-amber-500 dark:text-[#FFFC00]",
        };
      case "tiktok":
        return {
          icon: <Music2 className="w-5 h-5 text-rose-500" />,
          badge: "TIKTOK",
          badgeBg: "bg-black text-white border border-white/20",
          fallbackBg: "bg-rose-500/10 border-rose-500/20 text-rose-500",
        };
      case "instagram":
        return {
          icon: <Camera className="w-5 h-5 text-pink-500" />,
          badge: "IG",
          badgeBg: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white",
          fallbackBg: "bg-pink-500/10 border-pink-500/20 text-pink-500",
        };
      case "facebook":
        return {
          icon: <Globe className="w-5 h-5 text-blue-500" />,
          badge: "FB",
          badgeBg: "bg-blue-600 text-white",
          fallbackBg: "bg-blue-500/10 border-blue-500/20 text-blue-500",
        };
      default:
        if (link.link_type === "redirect") {
          return {
            icon: <Globe className="w-5 h-5 text-cyan-500" />,
            badge: "LINK",
            badgeBg: "bg-cyan-600 text-white",
            fallbackBg: "bg-cyan-500/10 border-cyan-500/20 text-cyan-500",
          };
        }
        return {
          icon: <ImageIcon className="w-5 h-5 text-amber-500 dark:text-[#FFFC00]" />,
          badge: "SNAP",
          badgeBg: "bg-[#FFFC00] text-black font-black",
          fallbackBg: "bg-[#FFFC00]/15 border-yellow-500/30 text-amber-500 dark:text-[#FFFC00]",
        };
    }
  };

  const pConfig = getPlatformConfig();
  const hasImage = Boolean(src) && !imgError;

  return (
    <div
      onClick={onClick}
      className={`relative shrink-0 overflow-hidden border border-slate-200/80 dark:border-white/10 bg-slate-100 dark:bg-black/50 shadow-sm flex items-center justify-center select-none group ${
        onClick ? "cursor-pointer active:scale-95 transition-transform" : ""
      } ${sizeClasses} ${className}`}
      title={link.title || "Preview thumbnail"}
    >
      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src!}
            alt={link.title || "Preview"}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
        </>
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${pConfig.fallbackBg}`}>
          {pConfig.icon}
        </div>
      )}

      {/* Tiny Platform Indicator Pill */}
      <span
        className={`absolute bottom-1 right-1 px-1 py-0.2 rounded-md text-[8px] font-mono font-bold tracking-tight shadow-sm z-10 leading-tight ${pConfig.badgeBg}`}
      >
        {pConfig.badge}
      </span>
    </div>
  );
};
