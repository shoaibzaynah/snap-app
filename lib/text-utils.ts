// lib/text-utils.ts
// Smart title and caption formatting for social media links (Instagram, TikTok, FB, YouTube)

/**
 * Extracts a clean, concise headline from a long social media caption.
 * Strips excessive trailing hashtags, repetitive links, and limits to a punchy first sentence.
 */
export function formatSocialTitle(rawTitle: string | null | undefined, maxChars = 90): string {
  if (!rawTitle) return "Untitled Snap";
  const cleaned = rawTitle.trim();
  if (!cleaned) return "Untitled Snap";

  // If already short, return directly
  if (cleaned.length <= maxChars && !cleaned.includes("\n")) {
    return cleaned;
  }

  // 1. Take first non-empty line
  const lines = cleaned.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  let firstLine = lines[0] || cleaned;

  // 2. If first line has hashtag spam at the end, clean trailing hashtags
  firstLine = firstLine.replace(/(?:#[a-zA-Z0-9_]+\s*){2,}$/, "").trim();

  // 3. If line has punctuation separating headline from promo body
  const sentenceMatch = firstLine.match(/^(.+?[.!?])(?:\s|$)/);
  if (sentenceMatch && sentenceMatch[1] && sentenceMatch[1].length >= 15 && sentenceMatch[1].length <= maxChars) {
    return sentenceMatch[1].trim();
  }

  // 4. Truncate gracefully at word boundary if still too long
  if (firstLine.length > maxChars) {
    const truncated = firstLine.slice(0, maxChars);
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 20 ? `${truncated.slice(0, lastSpace)}…` : `${truncated}…`;
  }

  return firstLine;
}

/**
 * Checks if a caption is significantly long (e.g., promo post with lots of text)
 * and should have an expandable disclosure card.
 */
export function isLongCaption(caption: string | null | undefined, threshold = 120): boolean {
  if (!caption) return false;
  return caption.trim().length > threshold || caption.includes("\n");
}

/**
 * Cleans long promotional descriptions (strips trailing hashtags, limits to clean ~160 chars)
 * ideal for WhatsApp & OpenGraph social share cards.
 */
export function formatSocialDescription(rawDesc: string | null | undefined, maxChars = 160): string {
  if (!rawDesc) return "";
  const cleaned = rawDesc.trim();
  if (!cleaned) return "";

  // 1. Remove trailing hashtag blocks
  const withoutTrailingHashtags = cleaned.replace(/(?:#[a-zA-Z0-9_]+\s*)+$/, "").trim();

  // If already short, return directly
  if (withoutTrailingHashtags.length <= maxChars) {
    return withoutTrailingHashtags;
  }

  // 2. Truncate at word boundary
  const truncated = withoutTrailingHashtags.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 20 ? `${truncated.slice(0, lastSpace)}…` : `${truncated}…`;
}
