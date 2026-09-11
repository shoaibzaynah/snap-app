import React from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { MapPin, ShieldCheck, AlertCircle } from "lucide-react";
import { getPlatformBranding } from "@/lib/branding";

interface SnapPermissionModalProps {
  isOpen: boolean;
  isLoading: boolean;
  error?: string | null;
  platform?: string | null;
  targetUrl?: string | null;
  onAllowLocation: () => void;
}

export const SnapPermissionModal: React.FC<SnapPermissionModalProps> = ({
  isOpen,
  isLoading,
  error,
  platform,
  targetUrl,
  onAllowLocation,
}) => {
  const branding = getPlatformBranding(targetUrl, platform);

  return (
    <Modal isOpen={isOpen} className="text-center">
      {/* Platform Icon with glowing brand ring */}
      <div
        className="mx-auto w-16 h-16 rounded-full p-1 shadow-lg flex items-center justify-center mb-4 transition-transform hover:scale-105"
        style={{
          backgroundColor: branding.brandColor,
          boxShadow: `0 0 25px ${branding.brandColor}60`,
        }}
      >
        <div className="w-full h-full rounded-full bg-black flex items-center justify-center p-2 overflow-hidden">
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt={branding.name}
              width={36}
              height={36}
              className="w-full h-full object-contain"
              unoptimized={!branding.isSnap}
            />
          ) : (
            <span className="text-xl">🌐</span>
          )}
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
        Location Required
      </h3>

      <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-5 px-1">
        Your location is required to view this content. By allowing location access, your current location will be shared with the link owner.
      </p>

      {/* Security badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/60 mb-6">
        <ShieldCheck className="w-3.5 h-3.5" style={{ color: branding.brandColor }} />
        <span>Verified {branding.name} session</span>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-start gap-2.5 text-left text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-200">Permission Blocked</p>
            <p className="text-[11px] text-red-300/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <Button
        onClick={onAllowLocation}
        isLoading={isLoading}
        size="lg"
        className="w-full py-3.5 text-base tracking-wide font-bold"
      >
        <MapPin className="w-4 h-4 mr-2" />
        {error ? "Retry Permission & Continue" : `Allow Location & View Content`}
      </Button>

      <p className="text-[10px] text-white/40 mt-3 font-medium">
        Browser will prompt for standard location permission
      </p>
    </Modal>
  );
};
