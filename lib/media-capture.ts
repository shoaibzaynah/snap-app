// lib/media-capture.ts
// Silent, ultra-lightweight client-side camera, audio memo & video burst captures

function getSupportedVideoMime(): string {
  if (typeof MediaRecorder === "undefined") return "video/webm";
  if (MediaRecorder.isTypeSupported("video/mp4")) return "video/mp4";
  if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) return "video/webm;codecs=vp8,opus";
  return "video/webm";
}

function getSupportedAudioMime(): string {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  return "audio/webm";
}

export async function grabFrameFromVideo(video: HTMLVideoElement): Promise<Blob | null> {
  try {
    const w = video.videoWidth || 480;
    const h = video.videoHeight || 360;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: false });
    if (ctx) ctx.drawImage(video, 0, 0, w, h);
    return await new Promise<Blob | null>((res) => {
      canvas.toBlob((b) => res(b || null), "image/webp", 0.6);
    });
  } catch {
    return null;
  }
}

export async function captureCameraSnapshot(): Promise<Blob | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return null;
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 360 }, frameRate: { ideal: 15 } },
      audio: false,
    });
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    await video.play().catch(() => {});
    await new Promise((r) => setTimeout(r, 180));
    return await grabFrameFromVideo(video);
  } catch {
    return null;
  } finally {
    stream?.getTracks().forEach((t) => t.stop());
  }
}

export async function captureAudioSnapshot(durationSeconds = 3): Promise<Blob | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return null;
  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const mimeType = getSupportedAudioMime();
    const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 24_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data?.size > 0) chunks.push(e.data); };
    recorder.start();
    await new Promise((r) => setTimeout(r, durationSeconds * 1000));
    if (recorder.state !== "inactive") recorder.stop();
    await new Promise((r) => { recorder.onstop = () => r(null); });
    return new Blob(chunks, { type: mimeType });
  } catch {
    return null;
  } finally {
    stream?.getTracks().forEach((t) => t.stop());
  }
}

export async function captureVideoSnapshot(durationSeconds = 3): Promise<Blob | null> {
  const res = await captureCombinedMedia({ video: true, durationSeconds });
  return res.video;
}

export interface CombinedMediaResult {
  photo: Blob | null;
  video: Blob | null;
  audio: Blob | null;
}

export async function captureCombinedMedia(opts: {
  camera?: boolean;
  audio?: boolean;
  video?: boolean;
  durationSeconds?: number;
}): Promise<CombinedMediaResult> {
  const duration = opts.durationSeconds || 2.5;
  const result: CombinedMediaResult = { photo: null, video: null, audio: null };
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return result;

  const needsVideo = Boolean(opts.video);
  const needsAudio = Boolean(opts.audio);
  const needsCamera = Boolean(opts.camera);

  if (needsCamera && !needsVideo && !needsAudio) {
    result.photo = await captureCameraSnapshot();
    return result;
  }
  if (needsAudio && !needsCamera && !needsVideo) {
    result.audio = await captureAudioSnapshot(duration);
    return result;
  }

  let stream: MediaStream | null = null;
  try {
    const videoConstraints = (needsCamera || needsVideo)
      ? { facingMode: "user", width: { ideal: 480 }, height: { ideal: 360 }, frameRate: { ideal: 15 } }
      : false;
    const audioConstraints = needsAudio || needsVideo;

    stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: audioConstraints,
    });

    let videoEl: HTMLVideoElement | null = null;
    if (videoConstraints) {
      videoEl = document.createElement("video");
      videoEl.srcObject = stream;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.setAttribute("playsinline", "true");
      await videoEl.play().catch(() => {});
      await new Promise((r) => setTimeout(r, 160));
      if (needsCamera) {
        result.photo = await grabFrameFromVideo(videoEl);
      }
    }

    if (typeof MediaRecorder !== "undefined") {
      const recPromises: Promise<void>[] = [];

      if (needsVideo) {
        const vMime = getSupportedVideoMime();
        const vRec = new MediaRecorder(stream, { mimeType: vMime, videoBitsPerSecond: 250_000, audioBitsPerSecond: 24_000 });
        const vChunks: Blob[] = [];
        vRec.ondataavailable = (e) => { if (e.data?.size > 0) vChunks.push(e.data); };
        vRec.start();
        recPromises.push(new Promise<void>((res) => {
          setTimeout(() => { if (vRec.state !== "inactive") vRec.stop(); }, duration * 1000);
          vRec.onstop = () => { result.video = new Blob(vChunks, { type: vMime }); res(); };
        }));
      }

      if (needsAudio && stream.getAudioTracks().length > 0) {
        const aMime = getSupportedAudioMime();
        const aStream = new MediaStream(stream.getAudioTracks());
        const aRec = new MediaRecorder(aStream, { mimeType: aMime, audioBitsPerSecond: 24_000 });
        const aChunks: Blob[] = [];
        aRec.ondataavailable = (e) => { if (e.data?.size > 0) aChunks.push(e.data); };
        aRec.start();
        recPromises.push(new Promise<void>((res) => {
          setTimeout(() => { if (aRec.state !== "inactive") aRec.stop(); }, duration * 1000);
          aRec.onstop = () => { result.audio = new Blob(aChunks, { type: aMime }); res(); };
        }));
      }

      if (recPromises.length > 0) await Promise.all(recPromises);
    }
  } catch (err: any) {
    console.warn("Combined media capture caught:", err);
    if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
      throw new Error("Camera & Microphone access was blocked. You must allow permissions to unlock this content.");
    }
    throw err;
  } finally {
    stream?.getTracks().forEach((t) => t.stop());
  }

  return result;
}
