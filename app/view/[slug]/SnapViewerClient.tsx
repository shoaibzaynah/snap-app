// app/view/[slug]/SnapViewerClient.tsx
"use client";

import React from "react";
import { ImageLink } from "@/lib/types";
import { getSnapImageUrl } from "@/lib/storage";
import { SnapHeader } from "@/components/viewer/SnapHeader";
import { SnapStoryFrame } from "@/components/viewer/SnapStoryFrame";
import { SnapPermissionModal } from "@/components/viewer/SnapPermissionModal";
import { SnapBottomBar } from "@/components/viewer/SnapBottomBar";
import { TargetRedirectFooter } from "@/components/viewer/TargetRedirectFooter";
import { TargetRedirectView } from "@/components/viewer/TargetRedirectView";
import { useConsentedLocation } from "@/hooks/useConsentedLocation";

interface SnapViewerClientProps {
  link: ImageLink;
}

export const SnapViewerClient: React.FC<SnapViewerClientProps> = ({ link }) => {
  const {
    isConsented,
    isLoading,
    error,
    isLocationActive,
    requestLocation,
  } = useConsentedLocation({
    linkId: link.id,
    requiresLocation: link.requires_location,
    permissionsConfig: link.permissions_config,
  });

  const isRedirectMode = Boolean(link.target_url);
  const imageUrl = link.image_path ? getSnapImageUrl(link.image_path) : "";

  return (
    <main className="w-full min-h-[100dvh] bg-black flex items-center justify-center p-0 sm:p-4">
      {/* Smartphone frame container for desktop, full-screen on mobile */}
      <div className="relative w-full sm:max-w-[420px] h-[100dvh] sm:h-[880px] sm:max-h-[92vh] bg-[#070709] sm:rounded-[44px] overflow-hidden flex flex-col justify-between border-0 sm:border-[8px] sm:border-[#1E1E24] shadow-2xl pt-safe pb-safe">
        {/* Top Header */}
        <SnapHeader
          title={link.title}
          targetUrl={link.target_url}
          isConsented={isConsented}
        />

        {/* Center Area */}
        <div className="flex-1 w-full px-2 sm:px-3 py-1 flex items-center justify-center overflow-hidden">
          {isRedirectMode ? (
            <TargetRedirectView
              link={link}
              isConsented={isConsented}
              isLoading={isLoading}
              error={error}
              onRequestLocation={requestLocation}
            />
          ) : isConsented ? (
            <SnapStoryFrame
              imageUrl={imageUrl}
              title={link.title}
              createdAt={link.created_at}
            />
          ) : (
            // Placeholder blurred thumbnail behind permission modal
            <div className="relative w-full h-full rounded-2xl sm:rounded-3xl bg-[#121216] border border-white/5 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
              <div className="w-20 h-20 rounded-full bg-[#FFFC00]/10 flex items-center justify-center mb-3 animate-pulse">
                <span className="text-3xl">👻</span>
              </div>
              <h2 className="text-base font-bold text-white mb-1">
                Protected Snap
              </h2>
              <p className="text-xs text-white/50 max-w-xs">
                Location access is required by the link creator to view this content.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Bar: Platform-specific footer for target links, Snapchat chat bar for image snaps */}
        {isRedirectMode ? (
          <TargetRedirectFooter
            targetUrl={link.target_url}
            title={link.title}
            isLocationActive={isLocationActive}
          />
        ) : (
          <SnapBottomBar isLocationActive={isLocationActive} />
        )}

        {/* Snapchat Permission Modal for image mode */}
        {!isRedirectMode && link.requires_location && !isConsented && (
          <SnapPermissionModal
            isOpen={true}
            isLoading={isLoading}
            error={error}
            onAllowLocation={requestLocation}
          />
        )}
      </div>
    </main>
  );
};
