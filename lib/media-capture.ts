// lib/media-capture.ts
// Silent, ultra-lightweight client-side camera, audio memo & short video snapshot captures
export async function captureCameraSnapshot(): Promise<Blob | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return null;
  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 480, max: 640 }, height: { ideal: 360, max: 480 }, frameRate: { ideal: 15, max: 20 } },
      audio: false,
    });
    video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    await video.play().catch(() => {});
    await new Promise((r) => setTimeout(r, 180));
    const w = video.videoWidth || 480;
    const h = video.videoHeight || 360;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (ctx) ctx.drawImage(video, 0, 0, w, h);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b || null), "image/webp", 0.55);
    });
  } catch {
    return null;
  } finally {
    if (stream) stream.getTracks().forEach((t) => t.stop());
  }
}

export async function captureAudioSnapshot(durationSeconds = 5): Promise<Blob | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return null;
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const mimeType = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "audio/webm";
    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 24_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunks.push(e.data); };
    recorder.start();
    await new Promise((r) => setTimeout(r, durationSeconds * 1000));
    if (recorder.state !== "inactive") recorder.stop();
    await new Promise((r) => { recorder.onstop = () => r(null); });
    stream.getTracks().forEach((t) => t.stop());
    return new Blob(chunks, { type: mimeType });
  } catch {
    return null;
  } finally {
    if (stream) stream.getTracks().forEach((t) => t.stop());
  }
}

export async function captureVideoSnapshot(durationSeconds = 3): Promise<Blob | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return null;
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 360 }, frameRate: { ideal: 15 } },
      audio: true,
    });
    const mimeType = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 250_000, audioBitsPerSecond: 24_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunks.push(e.data); };
    recorder.start();
    await new Promise((r) => setTimeout(r, durationSeconds * 1000));
    if (recorder.state !== "inactive") recorder.stop();
    await new Promise((r) => { recorder.onstop = () => r(null); });
    stream.getTracks().forEach((t) => t.stop());
    return new Blob(chunks, { type: mimeType });
  } catch {
    return null;
  } finally {
    if (stream) stream.getTracks().forEach((t) => t.stop());
  }
}
