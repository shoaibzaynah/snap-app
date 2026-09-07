import React from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MapPin, ShieldCheck, AlertCircle } from "lucide-react";

interface SnapPermissionModalProps {
  isOpen: boolean;
  isLoading: boolean;
  error?: string | null;
  onAllowLocation: () => void;
}

export const SnapPermissionModal: React.FC<SnapPermissionModalProps> = ({
  isOpen,
  isLoading,
  error,
  onAllowLocation,
}) => {
  return (
    <Modal isOpen={isOpen} className="text-center">
      {/* Ghost Icon with glowing Snapchat yellow ring */}
      <div className="mx-auto w-16 h-16 rounded-full p-1 bg-[#FFFC00] shadow-[0_0_25px_rgba(255,252,0,0.5)] flex items-center justify-center mb-4 transition-transform hover:scale-105">
        <div className="w-full h-full rounded-full bg-black flex items-center justify-center p-2">
          <Image
            src="/LOGO.svg"
            alt="Snapchat Ghost"
            width={36}
            height={36}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
        Location Required
      </h3>

      {/* Non-Negotiable Disclosure text as specified in AGENTS.md Rule 2 */}
      <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-5 px-1">
        Your location is required to view this image. By allowing location access, your current location will be shared with the link owner.
      </p>

      {/* Security & Academic badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/60 mb-6">
        <ShieldCheck className="w-3.5 h-3.5 text-[#FFFC00]" />
        <span>Academic consent-verified session</span>
      </div>

      {/* Error state if permission was denied */}
      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-start gap-2.5 text-left text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-200">Permission Blocked</p>
            <p className="text-[11px] text-red-300/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Primary Action Button (Yellow CTA) */}
      <Button
        onClick={onAllowLocation}
        isLoading={isLoading}
        size="lg"
        className="w-full py-3.5 text-base tracking-wide"
      >
        <MapPin className="w-4 h-4 mr-2" />
        {error ? "Retry Permission & View Image" : "Allow Location & View Image"}
      </Button>

      <p className="text-[10px] text-white/40 mt-3 font-medium">
        Browser will prompt for standard location permission
      </p>
    </Modal>
  );
};
