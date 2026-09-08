"use client";

// components/admin/PhotoLightboxModal.tsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !photoUrl) return null;

  const content = (
    <div
      className="fixed inset-0 z-[99999] flex flex-col justify-between bg-black/95 backdrop-blur-2xl animate-fadeIn select-none pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Top Header Bar */}
      <div
        className="w-full flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#0B0B0E]/95 border-b border-white/10 z-20 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 truncate mr-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFFC00]/15 border border-[#FFFC00]/30 flex items-center justify-center text-[#FFFC00] shrink-0">
            <Camera className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-white/50 font-mono truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Top Actions: Open Original & High-Visibility Close Button */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={photoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open Original</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFFC00] hover:bg-[#ffe600] text-black text-xs font-black shadow-lg shadow-yellow-500/20 active:scale-95 cursor-pointer"
            aria-label="Close photo"
          >
            <X className="w-4 h-4 stroke-[3]" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* Main Center Image View */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-auto">
        <div
          className="relative max-w-2xl max-h-[72vh] sm:max-h-[78vh] bg-black/80 rounded-2xl border border-white/15 overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt="Captured verification"
            className="w-full h-full max-h-[72vh] sm:max-h-[78vh] object-contain rounded-2xl"
          />
        </div>
      </div>

      {/* Bottom bar with easy mobile Close action and guidance */}
      <div
        className="px-4 py-3 bg-[#0B0B0E]/95 border-t border-white/10 flex items-center justify-between shrink-0 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[11px] text-white/40 font-mono truncate">
          Tap outside or press ESC to close
        </span>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer"
        >
          Close Preview
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

