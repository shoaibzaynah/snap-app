import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatLocalTime(dateString?: string | null): string {
  if (!dateString) return "Never";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Unknown";
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return "Unknown";
  }
}

export function formatLocalDateTime(dateString?: string | null): string {
  if (!dateString) return "Never";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Unknown";
    return d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return "Unknown";
  }
}

export function formatDate(dateString: string | null): string {
  return formatLocalDateTime(dateString);
}

export function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function decodeHtml(str?: string | null): string {
  if (!str) return "";
  let decoded = str;
  for (let i = 0; i < 2; i++) {
    decoded = decoded
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, "/")
      .replace(/&nbsp;/g, " ")
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  return decoded.trim();
}

export function getSafePreviewImageUrl(url?: string | null): string {
  if (!url) return "";
  let clean = url.replace(/&amp;/g, "&");
  // Route hotlink-protected social CDNs through local secure proxy
  if (
    clean.includes("fbcdn.net") ||
    clean.includes("cdninstagram.com") ||
    clean.includes("tiktokcdn.com") ||
    clean.includes("facebook.com")
  ) {
    return `/api/proxy-image?url=${encodeURIComponent(clean)}`;
  }
  return clean;
}



