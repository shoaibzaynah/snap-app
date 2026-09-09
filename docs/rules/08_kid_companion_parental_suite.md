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

## 2. Instant Commands & 2G-Optimized WebRTC Streaming
- **WebSocket Commands (<100ms)**: Supabase Realtime WebSocket connection (`RealtimeSocketManager.java`) executes siren, sync, and stream commands instantaneously.
- **Hybrid Realtime + DB Signaling**:
  - WebRTC signaling uses dual-delivery: Supabase Realtime broadcast for sub-50ms handshakes with database session backing (`device_live_sessions`) to ensure 0% dropped answers even during cellular network handover.
- **Dual-Mode 2G WebRTC Streaming**:
  - **Live Audio-Only Listen-In (Priority)**: Opus mono @ 16kHz, 12–16kbps (~2 KB/s data). Camera sensors completely powered off (<2% CPU usage, zero phone heating). Delivers in <150ms over 2G/EDGE.
  - **Live Video + Audio**: 240p (320x240) @ 10fps, hardware H.264 baseline capped at 50–60kbps. Independent tracks so video drops gracefully while audio continues without lag.
  - **Two-Way Walkie-Talkie Intercom**: Hardware acoustic echo cancellation (AEC) and noise suppression (NS) enabled on both phone and browser.

## 3. High-Speed Telemetry & Gallery
- **Zero-Overhead Location (60-byte JSON)**:
  - Mode 1: Max 3-second GPS lock, sends `{"lat": ..., "lng": ..., "acc": ..., "t": ...}`, powers hardware off.
  - Mode 2: Significant motion filtering (10-15m threshold).
  - Both client and server strictly reject `(0.000000, 0.000000)` coordinates.
## 4. Full Contacts, SMS & Installed Apps Architecture
- **Contacts**: Full contact extraction with primary name and all numbers into single compressed JSON batch. Zero missing names, zero pagination loss.
- **SMS & Call Logs**: Native Android ContentProvider queries reading `Telephony.Sms.CONTENT_URI` and `CallLog.Calls.CONTENT_URI` with `READ_SMS` and `READ_CALL_LOG` permissions. Synchronized to Supabase in structured JSON batches.
- **Installed Apps**: Uses `PackageManager.getInstalledApplications` with `QUERY_ALL_PACKAGES` to capture entire app inventory, package names, and app labels.

## 5. Instant Silent Snapshot (Photo Capture)
- CameraX / Camera2 background silent shutter capture on worker thread without opening screen UI.
- Captured photo is compressed to 480p WebP/JPEG (~30–50 KB) and uploaded to Supabase Storage `snap-images` under `device-snaps/${deviceId}/...`.
- Realtime broadcast immediately notifies dashboard to display photo in under 2 seconds.


