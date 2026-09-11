// lib/branding.ts
// Dynamic branding resolver for shared links across ANY website or platform

export interface PlatformBranding {
  name: string;
  logoUrl: string;
  faviconUrl: string;
  actionText: string;
  isSnap: boolean;
  brandColor: string;
  contentType: string;
  badgeText: string;
}

const FAVICON_BASE = "https://www.google.com/s2/favicons?sz=128&domain=";

export const EXPLICIT_PLATFORMS: Record<string, PlatformBranding> = {
  snapchat: { name: "Snapchat", logoUrl: "/LOGO.svg", faviconUrl: "/favicon.svg", actionText: "Open in Snapchat", isSnap: true, brandColor: "#FFFC00", contentType: "SNAP", badgeText: "SNAP STORY" },
  instagram: { name: "Instagram", logoUrl: `${FAVICON_BASE}instagram.com`, faviconUrl: `${FAVICON_BASE}instagram.com`, actionText: "Open in Instagram", isSnap: false, brandColor: "#E1306C", contentType: "STORY", badgeText: "INSTAGRAM STORY" },
  tiktok: { name: "TikTok", logoUrl: `${FAVICON_BASE}tiktok.com`, faviconUrl: `${FAVICON_BASE}tiktok.com`, actionText: "Watch on TikTok", isSnap: false, brandColor: "#00F2FE", contentType: "VIDEO", badgeText: "TIKTOK VIDEO" },
  youtube: { name: "YouTube", logoUrl: `${FAVICON_BASE}youtube.com`, faviconUrl: `${FAVICON_BASE}youtube.com`, actionText: "Watch on YouTube", isSnap: false, brandColor: "#FF0000", contentType: "VIDEO", badgeText: "YOUTUBE VIDEO" },
  facebook: { name: "Facebook", logoUrl: `${FAVICON_BASE}facebook.com`, faviconUrl: `${FAVICON_BASE}facebook.com`, actionText: "Open in Facebook", isSnap: false, brandColor: "#1877F2", contentType: "POST", badgeText: "FACEBOOK POST" },
  twitter: { name: "X (Twitter)", logoUrl: `${FAVICON_BASE}x.com`, faviconUrl: `${FAVICON_BASE}x.com`, actionText: "Open on X", isSnap: false, brandColor: "#1D9BF0", contentType: "POST", badgeText: "X POST" },
  x: { name: "X (Twitter)", logoUrl: `${FAVICON_BASE}x.com`, faviconUrl: `${FAVICON_BASE}x.com`, actionText: "Open on X", isSnap: false, brandColor: "#1D9BF0", contentType: "POST", badgeText: "X POST" },
  whatsapp: { name: "WhatsApp", logoUrl: `${FAVICON_BASE}whatsapp.com`, faviconUrl: `${FAVICON_BASE}whatsapp.com`, actionText: "Open in WhatsApp", isSnap: false, brandColor: "#25D366", contentType: "MEDIA", badgeText: "WHATSAPP MEDIA" },
  pinterest: { name: "Pinterest", logoUrl: `${FAVICON_BASE}pinterest.com`, faviconUrl: `${FAVICON_BASE}pinterest.com`, actionText: "View on Pinterest", isSnap: false, brandColor: "#E60023", contentType: "PIN", badgeText: "PINTEREST PIN" },
  linkedin: { name: "LinkedIn", logoUrl: `${FAVICON_BASE}linkedin.com`, faviconUrl: `${FAVICON_BASE}linkedin.com`, actionText: "Open on LinkedIn", isSnap: false, brandColor: "#0A66C2", contentType: "POST", badgeText: "LINKEDIN POST" },
  reddit: { name: "Reddit", logoUrl: `${FAVICON_BASE}reddit.com`, faviconUrl: `${FAVICON_BASE}reddit.com`, actionText: "Open on Reddit", isSnap: false, brandColor: "#FF4500", contentType: "POST", badgeText: "REDDIT POST" },
  browser: { name: "Web Browser", logoUrl: `${FAVICON_BASE}google.com`, faviconUrl: `${FAVICON_BASE}google.com`, actionText: "Open in Browser", isSnap: false, brandColor: "#00E5FF", contentType: "PAGE", badgeText: "WEB LINK" },
};

const KNOWN_DOMAINS: Array<{
  match: string[];
  platformKey: string;
}> = [
  { match: ["youtube.com", "youtu.be"], platformKey: "youtube" },
  { match: ["instagram.com"], platformKey: "instagram" },
  { match: ["tiktok.com"], platformKey: "tiktok" },
  { match: ["facebook.com", "fb.watch", "fb.com"], platformKey: "facebook" },
  { match: ["snapchat.com"], platformKey: "snapchat" },
  { match: ["twitter.com", "x.com"], platformKey: "twitter" },
  { match: ["whatsapp.com"], platformKey: "whatsapp" },
  { match: ["pinterest.com"], platformKey: "pinterest" },
  { match: ["linkedin.com"], platformKey: "linkedin" },
  { match: ["reddit.com"], platformKey: "reddit" },
];

export function getPlatformBranding(targetUrl?: string | null, platformOverride?: string | null): PlatformBranding {
  const normKey = (platformOverride || "").toLowerCase().trim();
  if (normKey && EXPLICIT_PLATFORMS[normKey]) {
    return EXPLICIT_PLATFORMS[normKey];
  }

  if (targetUrl) {
    try {
      const parsed = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
      const host = parsed.hostname.toLowerCase();
      const faviconUrl = `${FAVICON_BASE}${host}`;

      for (const p of KNOWN_DOMAINS) {
        if (p.match.some((m) => host.includes(m))) {
          return EXPLICIT_PLATFORMS[p.platformKey];
        }
      }

      const cleanHost = host.replace(/^www\./, "");
      const siteBase = cleanHost.split(".")[0];
      const capitalized = siteBase.charAt(0).toUpperCase() + siteBase.slice(1);

      return {
        name: cleanHost,
        logoUrl: faviconUrl,
        faviconUrl,
        actionText: `Open on ${capitalized}`,
        isSnap: false,
        brandColor: "#00E5FF",
        contentType: "WEBSITE",
        badgeText: `${cleanHost.toUpperCase()} LINK`,
      };
    } catch {}
  }

  return EXPLICIT_PLATFORMS.snapchat;
}
