# Rule 13: Ultra-Lightweight Media Encoding & 2G-Adaptive Formats (Rule 23)

To ensure instantaneous data transmission, zero device heating, zero database/bandwidth waste, and flawless operation on all networks from 2G/EDGE to 5G:

## 1. Audio Snaps & Voice Notes (Public Viewer & Ambient Memos)
- **Mandatory Lightweight Formats**: Must strictly encode using AAC-LC (`.m4a` / `audio/mp4`, 32kbps to 48kbps, mono, 22.05kHz/24kHz) or 3GPP/AMR-NB (`.3gp` / `audio/3gpp`, 12.2kbps, ~15KB per 15-second memo).
- **Browser Voice Snaps**: When recording audio directly in browser, encode using WebM Opus at 24-32kbps mono.
- **Strict Ban on Heavy Uncompressed Audio**: High-bitrate uncompressed audio (WAV, PCM, uncompressed AIFF, 320kbps MP3) is strictly prohibited across all endpoints and storage.
- **Instant Playback**: Voice clips must be under 100KB so they begin playing with sub-100ms latency even on EDGE/2G networks.

## 2. Live Video Streaming & Video Snaps (WebRTC & Stories)
- **Live Video Feeds (Peer-to-Peer WebRTC)**: Must use hardware-accelerated VP8 or H.264 constrained baseline at 640x480 @ 20fps or 480x360 @ 15fps (~250-400kbps bitrate). Dynamically downscale to 320x240 @ 15fps on high-latency or 2G/EDGE connections.
- **Live Audio-Only Listen-In Mode**: Must use Opus / AAC-LD at 16-24kbps mono (~2.5KB/s bandwidth) with camera sensors completely powered off to maintain < 2% CPU usage and zero phone heating.
- **Short Video Snaps**: Compressed MP4 (H.264 + AAC-LC) or WebM (VP8 + Opus) capped at 720p, 1-1.5Mbps target bitrate (<2MB per 10-second clip).

## 3. Photo / Image Snaps
- Must be captured and compressed to WebP (75-80% quality) or optimized JPEG (max 1280px dimension, 75-80% quality, file size ~80KB-140KB).
- Uncompressed raw image buffers, BMPs, or uncompressed PNGs (>1MB) must never be uploaded or stored.

## 4. Strict Deduplication Across All Telemetry & Media
- All telemetry sync pipelines (gallery media, contacts, call logs, SMS) must deduplicate records before insertion so no duplicate card or duplicate row is ever saved or rendered.
- Storage uploads must use deterministic or deduplicated hashing to prevent uploading identical media files multiple times.
