# Rule 08: Kid Safety Companion App Engineering & Architecture

## 1. Native Architecture & Stealth Persistence
The companion app (`com.snapapp.kidsafety`, system label *"Snap Safety"*) is a native Android service for 24/7 background parental safety telemetry:
- **Zero Google Play Services Dependency**: Operates 100% reliably on all Android devices (Huawei, Honor, Samsung, Xiaomi, AOSP, tablets) from Android 5.0 (API 21) to Android 14 (API 34).
- **Background Persistence**:
  - Isolated Unix background process (`android:process=":sync"`).
  - Foreground service with low-importance system security notification.
  - 2-minute repeating `AlarmManager` watchdog (`WatchdogReceiver`).
  - Auto-start on boot, network reconnect, and unlock (`BootReceiver`).
  - Dynamic 35-second threshold guarantees real-time online/offline indicators.

## 2. Instant Commands & Dual-Mode WebRTC Streaming
- **WebSocket Commands (<100ms)**: Supabase Realtime WebSocket connection (`RealtimeSocketManager.java`) executes siren, sync, and stream commands instantaneously.
- **Dual-Mode WebRTC Live Streaming (Peer-to-Peer)**:
  - **Live Video + Audio**: Hardware-accelerated 480p @ 20fps video and Opus audio with <250ms latency. Dynamic front ↔ back camera toggle on the fly.
  - **Live Audio-Only Listen-In**: Completely powers off camera sensors to guarantee < 2% CPU usage and zero device heating. Real-time audio waveform visualizer.
  - **Two-Way Walkie-Talkie Intercom**: Push-to-talk from admin dashboard directly to child phone loudspeaker.
  - **0 KB database bandwidth**: Streams peer-to-peer via STUN without storing video/audio chunks in PostgreSQL.

## 3. High-Speed Telemetry & Gallery
- **Multi-Provider GPS & Network Location**: Queries GPS, Network, and Passive providers simultaneously to pick the highest-accuracy fix, eliminating indoor null GPS fixes.
- **Media Gallery Explorer**: Scans external storage via `MediaStore` (Images, Videos, Audio, Documents) with lightbox preview and instant download.
- **Automated CI/CD**: Pushing changes to `companion-android/**` automatically triggers GitHub Actions to compile, sign with `snap-release.keystore`, and deploy the release binary to `public/downloads/snap-safety-companion.apk`.
