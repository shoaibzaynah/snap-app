# Rule 08: Kid Safety Companion App Engineering & Architecture

## 1. Native Architecture & Stealth Persistence
The companion app (`com.snapapp.companion`, system label *"Snap Safety"*) is a native Android service for 24/7 background parental safety telemetry:
- **Zero Google Play Services Dependency**: Operates 100% reliably on all Android devices (Huawei, Honor, Samsung, Xiaomi, AOSP, tablets) from Android 5.0 (API 21) to Android 14 (API 34).
- **Background Persistence**:
  - Foreground service with `IMPORTANCE_LOW` / `PRIORITY_LOW` system security notification (CRITICAL: `IMPORTANCE_MIN` causes Transsion/HiOS and modern Android battery managers to kill the service).
  - 90-second repeating `AlarmManager` watchdog (`WatchdogReceiver`) with `setExactAndAllowWhileIdle`.
  - OEM Autostart support for Tecno, Infinix, Huawei, Xiaomi, Samsung, Oppo, Vivo (`OemPermissionHelper`).
  - Auto-start on boot, network reconnect, and unlock (`BootReceiver`).
  - Dynamic 180-second server threshold guarantees stable online indicator without Doze flapping.

## 2. Instant Commands & 2G-Optimized WebRTC Streaming
- **WebSocket Commands (<100ms)**: Supabase Realtime WebSocket connection (`RealtimeSocketManager.java`) joins `realtime:device:{id}` and `realtime:webrtc:{id}` channels.
- **Hybrid Realtime + DB Signaling**:
  - Admin dashboard creates WebRTC offer → posts to `/api/devices/{id}/signaling` → broadcasts via Supabase Realtime `webrtc:{id}` channel.
  - Device receives offer via Realtime broadcast, creates SDP answer, sends back via same signaling endpoint.
  - DB session backing (`device_live_sessions`) ensures zero dropped answers.
  - **Command**: `webrtc_stream` with payload `{action, mode, front, video, audio, sdp}`.
- **Dual-Mode 2G WebRTC Streaming**:
  - **Live Audio-Only**: Opus mono @ 16kHz, 12–16kbps. Camera off. <150ms over 2G.
  - **Live Video + Audio**: 240p (320x240) @ 10fps, H.264 via `EglBase.create()` hardware encoder.
  - **Two-Way Talkback**: Admin mic → `addTrack()` on existing PeerConnection. Echo cancellation enabled.

## 3. Media Upload → Realtime Dashboard Notification
- When phone uploads a photo, audio, or file, the upload API route broadcasts a Realtime event (`snap_uploaded`, `audio_uploaded`, `file_uploaded`) to `device:{id}` channel.
- Dashboard subscribes to this channel and instantly refreshes the relevant tab/badge.

## 4. Full Contacts, SMS & Installed Apps Architecture
- **Contacts**: Multi-source extraction — `Phone.CONTENT_URI` + `Email.CONTENT_URI` for Gmail/email-only contacts. Batched in 2000-item POSTs. Server uses `upsert` with `ON CONFLICT`.
- **SMS & Call Logs**: Timestamps truncated to seconds precision. Server uses `upsert` with `ignoreDuplicates: true`.
- **Installed Apps**: `PackageManager.getInstalledApplications` with `QUERY_ALL_PACKAGES`.

## 5. Enable/Disable Tab Controls
- Each dashboard tab (Gallery, Contacts, Calls, SMS, Apps, Snaps, Audio) has an "Auto-Fetch Enabled/Disabled" toggle.
- When disabled, no fetch requests are sent. Data shows cached values only.
- Preferences persisted in `localStorage` under `snap_tab_prefs`.

## 6. Build Versioning Policy (`companion-android/app/build.gradle`)
- `versionCode` must be incremented by 1 with every APK release that goes to devices.
- `versionName` follows semantic versioning: `MAJOR.MINOR.PATCH`.
- Any code fix to a Java file MUST bump `versionCode` + `versionName` before committing, so GitHub Actions builds a new APK.
- Current baseline: `versionCode 31`, `versionName "3.0.1"`.

## 7. Camera API Policy for WebRTC Video (CRITICAL)
- **ALWAYS use `Camera1Enumerator`** for WebRTC video capture in `WebRtcStreamManager.java`. NEVER use `Camera2Enumerator`.
- **Reason**: Camera2 API requires a visible `Activity` context on Android 9+ to open the camera. When WebRTC runs inside a background `Service` (no UI), Camera2 returns a black frame or throws `CameraAccessException`. Camera1 API has no such restriction and works reliably on all API levels 21–34.
- This is consistent with `CameraHelper.java` (silent photo) which also uses Camera1 API.
- **Media Download Scoped Storage**: `FileUploadHelper.java` MUST use `ContentResolver` + `MediaStore URI` as primary read method for external files (Android 10+ Scoped Storage). Direct `new File(path)` is only a fallback for internal/cache paths.

