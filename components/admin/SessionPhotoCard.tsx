"use client";

// components/admin/SessionPhotoCard.tsx
import React, { useState } from "react";
import Image from "next/image";
import { Camera, Maximize2 } from "lucide-react";
import { PhotoLightboxModal } from "./PhotoLightboxModal";

interface SessionPhotoCardProps {
  photoUrl: string;
  visitorIp?: string | null;
}

export const SessionPhotoCard: React.FC<SessionPhotoCardProps> = ({
  photoUrl,
  visitorIp,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-3 bg-[#121216] rounded-2xl border border-white/5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Camera className="w-3.5 h-3.5 text-[#FFFC00]" />
          <span>Captured Photo Verification</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FFFC00] hover:underline cursor-pointer"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Open Photo</span>
        </button>
      </div>

      <div
        onClick={() => setIsOpen(true)}
        className="group relative w-28 h-28 rounded-xl overflow-hidden border border-white/10 cursor-pointer transition-all hover:border-[#FFFC00]/60 active:scale-95"
        title="Click to open image"
      >
        <Image
          src={photoUrl}
          alt="Capture"
          fill
          className="object-cover group-hover:scale-105 transition-transform"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Maximize2 className="w-5 h-5 text-[#FFFC00]" />
        </div>
      </div>

      <PhotoLightboxModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        photoUrl={photoUrl}
        subtitle={visitorIp ? `Visitor IP: ${visitorIp}` : undefined}
      />
    </div>
  );
};
