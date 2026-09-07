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

const KNOWN_DOMAINS: Array<{
  match: string[];
  name: string;
  brandColor: string;
  actionText: string;
  contentType: string;
  badgeText: string;
  isSnap?: boolean;
}> = [
  { match: ["youtube.com", "youtu.be"], name: "YouTube", brandColor: "#FF0000", actionText: "Watch on YouTube", contentType: "VIDEO", badgeText: "YOUTUBE VIDEO" },
  { match: ["instagram.com"], name: "Instagram", brandColor: "#E1306C", actionText: "Open in Instagram", contentType: "POST", badgeText: "INSTAGRAM POST" },
  { match: ["tiktok.com"], name: "TikTok", brandColor: "#00F2FE", actionText: "Watch on TikTok", contentType: "VIDEO", badgeText: "TIKTOK VIDEO" },
  { match: ["facebook.com", "fb.watch", "fb.com"], name: "Facebook", brandColor: "#1877F2", actionText: "Open in Facebook", contentType: "POST", badgeText: "FACEBOOK POST" },
  { match: ["snapchat.com"], name: "Snapchat", brandColor: "#FFFC00", actionText: "Open in Snapchat", contentType: "SNAP", badgeText: "SNAPCHAT SNAP", isSnap: true },
  { match: ["twitter.com", "x.com"], name: "X (Twitter)", brandColor: "#1D9BF0", actionText: "Open on X", contentType: "POST", badgeText: "X POST" },
  { match: ["linkedin.com"], name: "LinkedIn", brandColor: "#0A66C2", actionText: "Open on LinkedIn", contentType: "POST", badgeText: "LINKEDIN POST" },
  { match: ["reddit.com"], name: "Reddit", brandColor: "#FF4500", actionText: "Open on Reddit", contentType: "POST", badgeText: "REDDIT POST" },
  { match: ["netflix.com"], name: "Netflix", brandColor: "#E50914", actionText: "Watch on Netflix", contentType: "VIDEO", badgeText: "NETFLIX SHOW" },
  { match: ["spotify.com"], name: "Spotify", brandColor: "#1DB954", actionText: "Listen on Spotify", contentType: "TRACK", badgeText: "SPOTIFY TRACK" },
  { match: ["t.me", "telegram.org"], name: "Telegram", brandColor: "#24A1DE", actionText: "Open in Telegram", contentType: "CHANNEL", badgeText: "TELEGRAM POST" },
  { match: ["pinterest.com"], name: "Pinterest", brandColor: "#E60023", actionText: "View on Pinterest", contentType: "PIN", badgeText: "PINTEREST PIN" },
];

export function getPlatformBranding(targetUrl?: string | null): PlatformBranding {
  if (!targetUrl) {
    return {
      name: "Snapchat",
      logoUrl: "/LOGO.svg",
      faviconUrl: "/favicon.svg",
      actionText: "Open in Snapchat",
      isSnap: true,
      brandColor: "#FFFC00",
      contentType: "SNAP",
      badgeText: "SNAPCHAT SNAP",
    };
  }

  try {
    const parsed = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
    const host = parsed.hostname.toLowerCase();
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${host}&sz=128`;

    for (const p of KNOWN_DOMAINS) {
      if (p.match.some((m) => host.includes(m))) {
        return {
          name: p.name,
          logoUrl: p.isSnap ? "/LOGO.svg" : faviconUrl,
          faviconUrl: p.isSnap ? "/favicon.svg" : faviconUrl,
          actionText: p.actionText,
          isSnap: !!p.isSnap,
          brandColor: p.brandColor,
          contentType: p.contentType,
          badgeText: p.badgeText,
        };
      }
    }

    // Generic fallback for ANY website domain (ecommerce, news, blogs, tools, custom domains)
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
  } catch {
    return {
      name: "Shared Content",
      logoUrl: "/favicon.svg",
      faviconUrl: "/favicon.svg",
      actionText: "Open Link",
      isSnap: false,
      brandColor: "#00E5FF",
      contentType: "WEBSITE",
      badgeText: "VERIFIED LINK",
    };
  }
}
