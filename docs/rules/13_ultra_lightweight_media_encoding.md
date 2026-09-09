# Rule 13: Ultra-Lightweight Media Encoding & 2G/EDGE Bandwidth Architecture (Rule 23)

2G networks (EDGE) operate at constrained bandwidths of **50–150 kbps**. To ensure 100% zero-lag delivery, audio, video, and location streams MUST be isolated and encoded with aggressive compression:

## 1. Live Audio & Two-Way Talk (2G Priority Profile)
- **Audio Codec**: **Opus Codec** (Narrowband voice clarity).
- **Settings**:
  - Audio Mode: **Mono** (Stereo strictly disabled).
  - Sample Rate: **16 kHz** (Optimized for human speech).
  - Bitrate: **12 kbps to 16 kbps** (~2 KB/s data consumption, delivers in < 150ms over 2G).
- **Flow & Processing**:
  - **Listen Mode**: Mic captures 12–16 kbps UDP stream directly to dashboard.
  - **Two-Way Voice Chat**: Full-duplex with hardware Acoustic Echo Cancellation (AEC) and Noise Suppression (NS) mandatory on both phone and browser.
- **Ambient Voice Notes & Memos**:
  - Encoded using AAC-LC mono 32kbps @ 22.05kHz or AMR-NB 12.2kbps (~40–60KB per 15-second memo).

## 2. Live Video Camera Stream (2G Zero-Lag Profile)
- **Separate Tracks Architecture**: Video and audio MUST run on separate tracks. If cellular bandwidth drops below 50 kbps, video frames drop gracefully while audio and location continue uninterrupted.
- **Video Profile**:
  - Resolution: **240p (320x240 QVGA)**.
  - Frame Rate: **10 fps** (24fps and 30fps are strictly prohibited on mobile cellular streams).
  - Bitrate Cap: **50 kbps to 60 kbps**.
  - Encoder: Hardware H.264 Baseline Profile or VP8.
- **Camera Toggle**: Front ↔ Back toggle must swap the camera source on the fly without tearing down the WebRTC peer connection.

## 3. Location Tracking (Zero-Overhead Flow)
- Location payloads MUST NEVER be mixed into media streams.
- **Mode 1: One-Time Fetch**:
  - Dashboard sends fetch signal (< 1 KB).
  - Phone GPS hardware activates for maximum 3 seconds, captures accurate fix, and immediately powers down.
  - Broadcasts lightweight 60-byte JSON payload: `{"lat": 31.5204, "lng": 74.3587, "acc": 8, "t": 1715000000}`.
- **Mode 2: Live Movement Tracking**:
  - Uses Significant Motion distance filtering (minimum 10–15 meters) or 5–10s intervals.
  - Zero requests sent if device is stationary.
- **Zero Coordinate Ban**: Coordinates `(0.000000, 0.000000)` are strictly invalid and must be rejected by both client and server.

## 4. End-to-End Performance Targets
| Feature | Codec / Format | Bitrate / Resolution | Target Network | Latency |
|---|---|---|---|---|
| **Live Audio Listen** | Opus Mono | 12–16 kbps | Any 2G / EDGE | < 150 ms |
| **Two-Way Voice Chat** | Opus Mono + AEC | 16 kbps | Any 2G / EDGE | < 200 ms |
| **Ultra-Low Live Video** | H.264 / 10 fps | 240p (50–60 kbps) | Strong 2G / 3G | 250–400 ms |
| **Single Location Fetch** | Lightweight JSON | ~60 bytes | Any signal | Instant (< 1s) |
| **Live Map Movement** | Interval JSON | ~60 bytes / 5s | Any signal | Real-time |

