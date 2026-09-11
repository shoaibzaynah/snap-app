// lib/link-utils.ts
// Standard Link Status & Expiry Utilities for SNAP APP (Rule 14 Compliant)

import { ImageLink } from "@/lib/types";

export interface LinkStatusDetails {
  status: "active" | "expired" | "paused";
  badgeVariant: "active" | "expired" | "default";
  badgeLabel: string;
  isExpired: boolean;
  expiresAtFormatted: string | null;
  timeRemainingText: string;
}

export function formatTimeDiff(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${Math.max(1, mins)}m`;
}

export function getLinkStatusDetails(link: Partial<ImageLink>): LinkStatusDetails {
  if (!link.is_active) {
    return {
      status: "paused",
      badgeVariant: "expired",
      badgeLabel: "Paused",
      isExpired: false,
      expiresAtFormatted: link.expires_at
        ? new Date(link.expires_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })
        : null,
      timeRemainingText: "Link is paused",
    };
  }

  if (link.expires_at) {
    const expiryMs = new Date(link.expires_at).getTime();
    const now = Date.now();
    const formatted = new Date(link.expires_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" });

    if (expiryMs < now) {
      const ago = formatTimeDiff(now - expiryMs);
      return {
        status: "expired",
        badgeVariant: "expired",
        badgeLabel: "Expired",
        isExpired: true,
        expiresAtFormatted: formatted,
        timeRemainingText: `Expired ${ago} ago (${formatted})`,
      };
    }

    const left = formatTimeDiff(expiryMs - now);
    return {
      status: "active",
      badgeVariant: "active",
      badgeLabel: "Active",
      isExpired: false,
      expiresAtFormatted: formatted,
      timeRemainingText: `Expires in ${left} (${formatted})`,
    };
  }

  return {
    status: "active",
    badgeVariant: "active",
    badgeLabel: "Active",
    isExpired: false,
    expiresAtFormatted: null,
    timeRemainingText: "Never expires",
  };
}
