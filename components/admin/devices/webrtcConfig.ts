// components/admin/devices/webrtcConfig.ts
// Shared WebRTC ICE server config and signal flush helper

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];

/** Flush buffered ICE candidates after remote description is set */
export async function flushCandidates(
  pc: RTCPeerConnection,
  pending: RTCIceCandidateInit[]
): Promise<void> {
  for (const c of pending) {
    try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
  }
}
