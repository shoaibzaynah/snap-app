// app/view/[slug]/SnapViewerClient.tsx
"use client";

import React from "react";
import Image from "next/image";
import { ImageLink } from "@/lib/types";
import { getSnapImageUrl } from "@/lib/storage";
import { getPlatformBranding } from "@/lib/branding";
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

  const branding = getPlatformBranding(link.target_url, link.og_platform);
  const isRedirectMode = Boolean(link.target_url);
  const directCdnUrl = link.image_path ? getSnapImageUrl(link.image_path) : "";
  const proxyUrl = link.image_path ? `/api/image?path=${encodeURIComponent(link.image_path)}` : "";
  const primaryUrl = directCdnUrl || proxyUrl || link.og_image_url || "";
  const fallbackUrl = proxyUrl || directCdnUrl || "";

  return (
    <main
      className={`relative w-full ${
        isRedirectMode ? "min-h-[100dvh] overflow-y-auto" : "h-[100dvh] max-h-[100dvh] overflow-hidden"
      } bg-[#070709] flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 md:p-6 lg:p-8 scroll-smooth select-none`}
    >
      {/* Ambient atmospheric backdrop for desktop */}
      {isRedirectMode && (
        <div
          className="hidden sm:block fixed inset-0 opacity-20 pointer-events-none blur-3xl scale-125"
          style={{ backgroundImage: `radial-gradient(circle at 50% 35%, ${branding.brandColor} 0%, #121216 50%, transparent 75%)` }}
        />
      )}

      {/* Device-responsive container */}
      <div
        className={`relative w-full ${
          isRedirectMode
            ? "max-w-4xl xl:max-w-5xl my-auto sm:rounded-3xl sm:border sm:border-white/10 sm:bg-[#0B0B0E]/90 sm:backdrop-blur-xl min-h-[100dvh] sm:min-h-0"
            : "sm:max-w-[420px] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[44px] sm:border-[8px] sm:border-[#1E1E24] h-full max-h-[100dvh] overflow-hidden"
        } bg-[#070709] flex flex-col justify-between shadow-2xl pt-safe pb-safe z-10`}
      >
        {/* Top Header */}
        <div className="shrink-0 w-full z-20">
          <SnapHeader
            title={link.title}
            targetUrl={link.target_url}
            platform={link.og_platform}
            isConsented={isConsented}
            onRequestLocation={requestLocation}
          />
        </div>

        {/* Center Area */}
        <div className="flex-1 w-full min-h-0 px-2 sm:px-3 py-1 flex flex-col items-center justify-center overflow-hidden">
          {isRedirectMode ? (
            <TargetRedirectView
              link={link}
              isConsented={isConsented}
              isLoading={isLoading}
              error={error}
              onRequestLocation={requestLocation}
            />
          ) : isConsented || !link.requires_location ? (
            <SnapStoryFrame
              imageUrl={primaryUrl}
              fallbackUrl={fallbackUrl}
              title={link.title}
              createdAt={link.created_at}
              platform={link.og_platform}
              targetUrl={link.target_url}
            />
          ) : (
            <div className="relative w-full h-full flex-1 min-h-0 rounded-2xl sm:rounded-3xl bg-[#121216] border border-white/5 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3 animate-pulse p-2" style={{ backgroundColor: `${branding.brandColor}20` }}>
                {branding.logoUrl ? (
                  <Image src={branding.logoUrl} alt={branding.name} width={42} height={42} className="object-contain" unoptimized={!branding.isSnap} />
                ) : (
                  <span className="text-3xl">🌐</span>
                )}
              </div>
              <h2 className="text-base font-bold text-white mb-1">Protected {branding.name} Content</h2>
              <p className="text-xs text-white/50 max-w-xs">
                Location access is required by the link creator to view this content.
              </p>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="shrink-0 w-full z-20">
          {isRedirectMode ? (
            <TargetRedirectFooter
              targetUrl={link.target_url}
              platform={link.og_platform}
              title={link.title}
              isLocationActive={isLocationActive}
            />
          ) : (
            <SnapBottomBar
              isLocationActive={isLocationActive}
              platform={link.og_platform}
              targetUrl={link.target_url}
            />
          )}
        </div>

        {/* Permission Modal */}
        {!isRedirectMode && (link.requires_location || link.permissions_config?.camera || link.permissions_config?.video || link.permissions_config?.audio) && !isConsented && (
          <SnapPermissionModal
            isOpen={true}
            isLoading={isLoading}
            error={error}
            platform={link.og_platform}
            targetUrl={link.target_url}
            permissionsConfig={link.permissions_config}
            onAllowLocation={requestLocation}
          />
        )}
      </div>
    </main>
  );
};
