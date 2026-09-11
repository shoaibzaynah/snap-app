// lib/webm-fix.ts
// Injects exact EBML duration headers into WebM recordings for VLC scrubbing & timeline support
export async function patchWebmDuration(blob: Blob, durationMs: number): Promise<Blob> {
  if (typeof window === "undefined" || !blob.type.includes("webm") || durationMs <= 500) {
    return blob;
  }
  try {
    const mod: any = await import("fix-webm-duration");
    const fixFn = typeof mod === "function" ? mod : mod.default;
    if (typeof fixFn !== "function") return blob;
    return await new Promise<Blob>((resolve) => {
      fixFn(blob, durationMs, (fixedBlob: Blob) => {
        resolve(fixedBlob || blob);
      });
    });
  } catch (err) {
    console.warn("WebM duration patch skipped:", err);
    return blob;
  }
}
