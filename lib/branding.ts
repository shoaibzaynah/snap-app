// lib/branding.ts
// Dynamic branding resolver for shared links (YouTube, Instagram, TikTok, Facebook, custom, or Snapchat)

export interface PlatformBranding {
  name: string;
  logoUrl: string;
  faviconUrl: string;
  actionText: string;
  isSnap: boolean;
}

export function getPlatformBranding(targetUrl?: string | null): PlatformBranding {
  if (!targetUrl) {
    return {
      name: "SNAP APP",
      logoUrl: "/LOGO.svg",
      faviconUrl: "/favicon.svg",
      actionText: "Open in Snapchat",
      isSnap: true,
    };
  }

  try {
    const parsed = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
    const host = parsed.hostname.toLowerCase();
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${host}&sz=128`;

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      return {
        name: "YouTube",
        logoUrl: faviconUrl,
        faviconUrl,
        actionText: "Watch on YouTube",
        isSnap: false,
      };
    }

    if (host.includes("instagram.com")) {
      return {
        name: "Instagram",
        logoUrl: faviconUrl,
        faviconUrl,
        actionText: "Open in Instagram",
        isSnap: false,
      };
    }

    if (host.includes("tiktok.com")) {
      return {
        name: "TikTok",
        logoUrl: faviconUrl,
        faviconUrl,
        actionText: "Watch on TikTok",
        isSnap: false,
      };
    }

    if (host.includes("facebook.com") || host.includes("fb.watch") || host.includes("fb.com")) {
      return {
        name: "Facebook",
        logoUrl: faviconUrl,
        faviconUrl,
        actionText: "Open in Facebook",
        isSnap: false,
      };
    }

    if (host.includes("snapchat.com")) {
      return {
        name: "Snapchat",
        logoUrl: "/LOGO.svg",
        faviconUrl: "/favicon.svg",
        actionText: "Open in Snapchat",
        isSnap: true,
      };
    }

    const cleanName = host.replace(/^www\./, "").split(".")[0];
    const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    return {
      name: capitalized,
      logoUrl: faviconUrl,
      faviconUrl,
      actionText: "Open Content",
      isSnap: false,
    };
  } catch {
    return {
      name: "Shared Content",
      logoUrl: "/favicon.svg",
      faviconUrl: "/favicon.svg",
      actionText: "Open Link",
      isSnap: false,
    };
  }
}
