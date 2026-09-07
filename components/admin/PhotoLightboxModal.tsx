"use client";

// components/admin/PhotoLightboxModal.tsx
import React, { useEffect } from "react";
import { X, ExternalLink, Camera } from "lucide-react";

interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  title?: string;
  subtitle?: string;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  title = "Captured Photo Verification",
  subtitle,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !photoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/90 backdrop-blur-xl animate-fadeIn select-none">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between px-4 sm:px-6 py-4 bg-[#0d0d11]/80 border-b border-white/10 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFFC00]/10 border border-[#FFFC00]/30 flex items-center justify-center text-[#FFFC00]">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-white/50 font-mono">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Top Actions: Open Original & Close (X) */}
        <div className="flex items-center gap-2.5">
          <a
            href={photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFFC00] hover:bg-[#ffe600] text-black text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Original</span>
          </a>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      {/* Main Center Image View (Clicking outside closes modal) */}
      <div
        className="flex-1 flex items-center justify-center p-4 overflow-auto cursor-zoom-out"
        onClick={onClose}
      >
        <div
          className="relative max-w-2xl max-h-[78vh] bg-black/60 rounded-2xl border border-white/15 overflow-hidden shadow-2xl cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="Captured verification"
            className="w-full h-full max-h-[78vh] object-contain rounded-2xl"
          />
        </div>
      </div>

      {/* Bottom info hint */}
      <div className="py-2.5 text-center text-[11px] text-white/40 bg-[#0d0d11]/80 border-t border-white/5 font-mono">
        Click outside or press ESC to close • Right-click or use Open Original to download
      </div>
    </div>
  );
};
