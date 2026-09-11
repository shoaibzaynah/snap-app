// components/admin/devices/webrtcConfig.ts
// Shared WebRTC ICE server config and signal flush helper

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.services.mozilla.com" },
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:standard.relay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:standard.relay.metered.ca:80?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];

export const postSignal = (deviceId: string, body: Record<string, any>) =>
  fetch(`/api/devices/${deviceId}/signaling`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });

/** Flush buffered ICE candidates after remote description is set */
export async function flushCandidates(
  pc: RTCPeerConnection,
  pending: RTCIceCandidateInit[]
): Promise<void> {
  for (const c of pending) {
    try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
  }
}

export async function setupPeerTracks(pc: RTCPeerConnection, mode: "video" | "audio") {
  let talkStream: MediaStream | null = null;
  let talkTrack: MediaStreamTrack | null = null;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    talkStream = stream;
    const tr = stream.getAudioTracks()[0];
    if (tr) { tr.enabled = false; talkTrack = tr; pc.addTrack(tr, stream); }
  } catch {
    try { pc.addTransceiver("audio", { direction: "sendrecv" }); } catch {}
  }
  if (mode === "video") { try { pc.addTransceiver("video", { direction: "recvonly" }); } catch {} }
  return { talkStream, talkTrack };
}
