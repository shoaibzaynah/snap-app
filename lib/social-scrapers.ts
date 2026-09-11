// lib/social-scrapers.ts
// Deep metadata & first-post thumbnail extractor for Instagram, FB, TikTok, & YouTube carousels

/**
 * Extracts first post image/thumbnail from JSON-LD embedded in social pages.
 */
export function extractJsonLdThumbnail(html: string): string | null {
  try {
    const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      if (!match[1]) continue;
      try {
        const data = JSON.parse(match[1].trim());
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          // 1. Direct thumbnailUrl or image
          if (item.thumbnailUrl && typeof item.thumbnailUrl === "string") return item.thumbnailUrl;
          if (typeof item.image === "string") return item.image;
          if (Array.isArray(item.image) && item.image[0]) {
            const first = item.image[0];
            return typeof first === "string" ? first : first.url || null;
          }
          if (item.image?.url && typeof item.image.url === "string") return item.image.url;

          // 2. Carousel / Multi-post itemListElement (First post in carousel)
          if (Array.isArray(item.itemListElement) && item.itemListElement.length > 0) {
            const firstSlide = item.itemListElement[0];
            const slideImg = firstSlide?.image || firstSlide?.item?.image || firstSlide?.thumbnailUrl;
            if (typeof slideImg === "string") return slideImg;
            if (slideImg?.url) return slideImg.url;
          }
        }
      } catch {
        // Continue to next match
      }
    }
  } catch {
    // Ignore JSON-LD parsing errors
  }
  return null;
}

/**
 * Extracts the first high-quality post thumbnail from multiple social meta tags,
 * filtering out generic platform logos or tracking pixels.
 */
export function extractFirstMetaThumbnail(html: string): string | null {
  const metaRegex = /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url|:url)?|twitter:image(?::src)?)["'][^>]+content=["']([^"']+)["']/gi;
  const revRegex = /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:image(?::secure_url|:url)?|twitter:image(?::src)?)["']/gi;

  const matches: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = metaRegex.exec(html)) !== null) {
    if (m[1]) matches.push(m[1].trim());
  }
  while ((m = revRegex.exec(html)) !== null) {
    if (m[1]) matches.push(m[1].trim());
  }

  // Filter out tiny tracker icons or generic fallback logos
  for (const imgUrl of matches) {
    const lower = imgUrl.toLowerCase();
    const isGeneric =
      lower.includes("favicon") ||
      lower.includes("tracking") ||
      lower.includes("1x1") ||
      lower.includes("rsrc.php") ||
      lower.includes("static.xx.fbcdn.net") ||
      lower.includes("static.cdninstagram.com") ||
      lower.includes("instagram.com/static") ||
      lower.includes("mobile_nav_type_logo") ||
      lower.includes("apple-touch-icon") ||
      lower.startsWith("data:image");
    if (!isGeneric && (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("/"))) {
      return imgUrl.replace(/&amp;/g, "&");
    }
  }

  // Never leak a generic logo if all candidates were generic assets
  return null;
}
