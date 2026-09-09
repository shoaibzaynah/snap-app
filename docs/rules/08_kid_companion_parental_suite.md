# Rule 08: Kid Safety Companion App Engineering & Architecture

## 1. Native Architecture & Stealth Persistence
The companion app (`com.snapapp.companion`, system label *"Snap Safety"*) is a native Android service for 24/7 background parental safety telemetry:
- **Zero Google Play Services Dependency**: Operates 100% reliably on all Android devices (Huawei, Honor, Samsung, Xiaomi, AOSP, tablets) from Android 5.0 (API 21) to Android 14 (API 34).
- **Background Persistence**:
  - Foreground service with low-importance system security notification.
  - 2-minute repeating `AlarmManager` watchdog (`WatchdogReceiver`).
  - Auto-start on boot, network reconnect, and unlock (`BootReceiver`).
  - Dynamic 35-second threshold guarantees real-time online/offline indicators.

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
