// lib/metadata.ts
import { PlatformType, ScrapedMetadata } from "@/lib/types";
import { decodeHtml } from "./utils";
import { extractJsonLdThumbnail, extractFirstMetaThumbnail } from "./social-scrapers";
import { formatSocialTitle, formatSocialDescription } from "./text-utils";

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
    return u.hostname.includes("youtu.be") ? (u.pathname.slice(1).split("?")[0] || null) : u.searchParams.get("v");
  } catch {
    return null;
  }
}

function extractMetaTag(html: string, property: string): string | null {
  const m1 = html.match(new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:)?${property}["'][^>]+content=["']([^"']+)["']`, "i"));
  if (m1?.[1]) return m1[1].trim();
  const m2 = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:)?${property}["']`, "i"));
  return m2?.[1]?.trim() || null;
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
    } catch {}

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
        const rawTitle = data.title || "Watch TikTok Video";
        return {
          title: formatSocialTitle(rawTitle),
          description: data.author_name ? `@${data.author_name} on TikTok` : "Trending on TikTok",
          image: data.thumbnail_url || null,
          platform: "tiktok",
          siteName: "TikTok",
        };
      }
    } catch {}
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

    let html = "";
    if (res.ok) {
      html = await res.text();
    } else {
      // Retry with standard Chrome User-Agent if bot UA is blocked by cloudflare/firewalls
      const retryRes = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      if (retryRes.ok) html = await retryRes.text();
    }

    if (html) {
      let rawTitle = extractMetaTag(html, "title") || extractMetaTag(html, "twitter:title");
      if (!rawTitle) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) rawTitle = titleMatch[1].trim();
      }

      let description = extractMetaTag(html, "description") || extractMetaTag(html, "twitter:description");

      // Deep Multi-Post Carousel Extraction: Prioritize first post slide
      let image =
        extractJsonLdThumbnail(html) ||
        extractFirstMetaThumbnail(html) ||
        extractMetaTag(html, "image") ||
        extractMetaTag(html, "image:secure_url") ||
        extractMetaTag(html, "twitter:image");

      if (!image) {
        const linkImg = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i);
        if (linkImg && linkImg[1]) image = linkImg[1];
      }

      if (image) {
        const lower = image.toLowerCase();
        const isGeneric =
          lower.includes("rsrc.php") ||
          lower.includes("static.cdninstagram.com") ||
          lower.includes("mobile_nav_type_logo") ||
          lower.includes("favicon") ||
          lower.startsWith("data:image");
        if (isGeneric) {
          image = null;
        } else {
          image = image.replace(/&amp;/g, "&").trim();
          try {
            image = new URL(image, targetUrl).href;
          } catch {}
        }
      }

      const siteName = extractMetaTag(html, "site_name");
      let decodedTitle = rawTitle ? decodeHtml(rawTitle) : null;
      if (decodedTitle && decodedTitle.toLowerCase() === "instagram") decodedTitle = null;

      let rawDesc = description ? decodeHtml(description) : null;
      if (rawDesc && (rawDesc.toLowerCase().includes("create an account") || rawDesc.toLowerCase().includes("log in to instagram"))) {
        rawDesc = null;
      }

      const formattedTitle = decodedTitle ? formatSocialTitle(decodedTitle) : null;
      const formattedDesc = rawDesc ? formatSocialDescription(rawDesc) : null;

      return {
        title: formattedTitle || decodedTitle,
        description: formattedDesc || (decodedTitle ? formatSocialDescription(decodedTitle) : null),
        image: image || null,
        platform,
        siteName: siteName ? decodeHtml(siteName) : (platform !== "custom" ? platform.toUpperCase() : null),
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
