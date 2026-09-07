// lib/metadata.ts
// Utility to scrape and extract OpenGraph metadata for rich preview cards
import { PlatformType, ScrapedMetadata } from "@/lib/types";

export function detectPlatform(urlStr: string): PlatformType {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("facebook.com") || host.includes("fb.watch") || host.includes("fb.com")) return "facebook";
    if (host.includes("snapchat.com")) return "snapchat";
    return "custom";
  } catch {
    return "custom";
  }
}

function extractYouTubeId(urlStr: string): string | null {
  try {
    const u = new URL(urlStr);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("?")[0] || null;
    }
    return u.searchParams.get("v") || null;
  } catch {
    return null;
  }
}

function extractMetaTag(html: string, property: string): string | null {
  // Try property="..." content="..."
  const propRegex = new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:)?${property}["'][^>]+content=["']([^"']+)["']`, "i");
  const propMatch = html.match(propRegex);
  if (propMatch && propMatch[1]) return propMatch[1].trim();

  // Try content="..." property="..."
  const reverseRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:)?${property}["']`, "i");
  const revMatch = html.match(reverseRegex);
  if (revMatch && revMatch[1]) return revMatch[1].trim();

  return null;
}

export async function fetchUrlMetadata(targetUrl: string): Promise<ScrapedMetadata> {
  const platform = detectPlatform(targetUrl);

  // 1. YouTube specific fast path
  if (platform === "youtube") {
    const videoId = extractYouTubeId(targetUrl);
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 3600 },
      });
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        return {
          title: data.title || "YouTube Video",
          description: data.author_name ? `Uploaded by ${data.author_name}` : "Watch on YouTube",
          image: data.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null),
          platform: "youtube",
          siteName: "YouTube",
        };
      }
    } catch {
      // Fallback
    }

    if (videoId) {
      return {
        title: "YouTube Video",
        description: "Watch this video on YouTube",
        image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        platform: "youtube",
        siteName: "YouTube",
      };
    }
  }

  // 2. TikTok oEmbed fast path
  if (platform === "tiktok") {
    try {
      const oembedRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(targetUrl)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        return {
          title: data.title || "Watch TikTok Video",
          description: data.author_name ? `@${data.author_name} on TikTok` : "Trending on TikTok",
          image: data.thumbnail_url || null,
          platform: "tiktok",
          siteName: "TikTok",
        };
      }
    } catch {
      // Fallback
    }
  }

  // 3. Generic HTML scraping path
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php) Mozilla/5.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      let title = extractMetaTag(html, "title");
      if (!title) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) title = titleMatch[1].trim();
      }

      let description = extractMetaTag(html, "description");
      let image = extractMetaTag(html, "image");
      const siteName = extractMetaTag(html, "site_name");

      return {
        title: title || null,
        description: description || null,
        image: image || null,
        platform,
        siteName: siteName || (platform !== "custom" ? platform.toUpperCase() : null),
      };
    }
  } catch (err) {
    console.warn("HTML metadata scrape error:", err);
  }

  return {
    title: null,
    description: null,
    image: null,
    platform,
    siteName: platform !== "custom" ? platform.toUpperCase() : null,
  };
}
