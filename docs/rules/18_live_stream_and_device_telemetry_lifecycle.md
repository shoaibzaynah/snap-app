# Rule 18: Live Stream, Device Telemetry & Background Persistence Lifecycle

> **MANDATORY DIRECTIVE FOR ALL SESSIONS**: Whenever modifying live WebRTC streaming, background companion services, GPS location synchronization, or tab refresh logic, you MUST strictly adhere to this specification. These standards guarantee zero battery drain, zero background process termination, and 100% telemetry reliability across all Android OEM manufacturers (Honor, Tecno, Infinix, Samsung, Xiaomi, Huawei, Vivo, Oppo).

---

## 1. WebRTC Live Streaming & Signaling Architecture
SNAP APP companion streams live audio and video directly to the admin dashboard using a Star / P2P topology with Metered STUN/TURN fallback:

1. **Signaling Channel**:
   - Ephemeral WebRTC signaling (`offer`, `answer`, `candidate`, `stop`) runs over Supabase Realtime Broadcast (`realtime:webrtc:{deviceId}`) to avoid database write storms.
   - Backup signaling via `/api/devices/{id}/signaling` ensures reliable session negotiation even on unstable 2G connections.
2. **Camera1 API Background Rule (CRITICAL)**:
   - **ALWAYS use `Camera1Enumerator`** in `WebRtcStreamManager.java`. NEVER use `Camera2Enumerator`.
   - *Reason*: Android 9+ restricts `Camera2` to visible foreground `Activity` contexts. In a headless background `Service`, Camera2 throws `CameraAccessException` or yields black frames. `Camera1` operates reliably across API levels 21–34 without UI.
3. **Metered STUN/TURN ICE Traversal**:
   - Dual STUN (`stun.relay.metered.ca:80`) and TURN TCP/UDP (`turn.relay.metered.ca:443`) servers guarantee connection through symmetric corporate/carrier CGNAT firewalls.
4. **Bandwidth Limits (2G Optimized)**:
   - Live Video: 240p (320x240) @ 10fps, H.264 baseline encoder. Max bitrate: 150kbps.
   - Live Audio: Opus mono @ 16kHz, 12–16kbps. Latency: <150ms.

---

## 2. Universal Android OEM Background Persistence Policy
Android OEMs (particularly Transsion HiOS/XOS on Tecno/Infinix, MIUI on Xiaomi, and ColorOS on Oppo) aggressively kill background services within 60–180 seconds of screen timeout unless specific rules are met:

1. **Foreground Notification Importance (`IMPORTANCE_LOW`)**:
   - **Channel**: MUST use `NotificationManager.IMPORTANCE_LOW` (or `DEFAULT`).
   - **Notification**: MUST use `NotificationCompat.PRIORITY_LOW`.
   - *Prohibition*: `IMPORTANCE_MIN` / `PRIORITY_MIN` is **strictly FORBIDDEN**. Transsion "Battery Lab" and Android Doze classify `MIN` services as inactive background tasks and terminate them when the screen turns off.
2. **WakeLock Execution Architecture**:
   - Any background task triggered via WebSocket or Alarm MUST acquire a `PowerManager.PARTIAL_WAKE_LOCK`:
     - Location Fetch: 30 seconds (`CompanionSyncService.acquireActionWakeLock(ctx, 30000L)`).
     - Camera Capture: 20 seconds.
     - Media / File Uploads: 90 seconds (`FileUploadHelper`).
     - Telemetry Sync (Contacts, SMS, Calls, Apps, Gallery): 45 seconds (`CommandDispatcher`).
3. **Watchdog Receiver Calibration**:
   - Repeating Alarm: `WatchdogReceiver` uses `AlarmManager.setExactAndAllowWhileIdle` at **90-second intervals** (`INTERVAL_MS = 90000L`).
   - Auto-Recovery: Re-launches `CompanionSyncService` if killed by low memory or OS battery cleaners.
4. **Server Online Threshold (180 Seconds)**:
   - In `app/api/devices/route.ts` and `app/api/devices/[id]/route.ts`, `is_online` is evaluated as:
     `Date.now() - new Date(device.last_seen_at).getTime() < 180000` (3 minutes).
   - This provides sufficient margin for Android Doze alarm batching without triggering false "Offline" flips.
5. **OEM Autostart Intent Matrix**:
   - `OemPermissionHelper.java` must provide direct intent shortcuts to whitelist "Snap Safety" in OEM battery managers:
     - Tecno / Infinix / Itel: `com.transsion.phonemaster` (`StartupAppListActivity`).
     - Xiaomi / Redmi: `com.miui.securitycenter` (`AutoStartManagementActivity`).
     - Huawei / Honor: `com.huawei.systemmanager` (`StartupAppControlActivity`).
     - Samsung: `com.samsung.android.lool` (`BatteryActivity`).

---

## 3. Must-Fresh Location on Fetch Protocol
When an admin clicks `[Fetch]` on the dashboard map, the location returned must be 100% fresh from hardware:

1. **Strictly Ignore Stale Cache**:
   - When `isFetchRequested = true`, companion MUST NOT dispatch `getLastKnownLocation()`. Cached fixes represent past history, not current position.
2. **Hardware Acquisition Cycle**:
   - Turn ON `GPS_PROVIDER` and `NETWORK_PROVIDER` with 1-second interval (`1000L`, `0.0f`).
   - Acquire 30s WakeLock to keep CPU active while GPS hardware locks onto satellites.
3. **Guaranteed Database History Persist**:
   - Companion sends `force_persist = true` via `ApiClient.sendLocation`.
   - Endpoint `/api/device-sync/location` checks `body.force_persist || body.is_fetch` and bypasses the 30m distance threshold, guaranteeing an immediate `INSERT` into `device_locations`.
4. **Hardware Teardown**:
   - Immediately upon sending the fresh fix, call `locationManager.removeUpdates(locationListener)` and set `isFetchRequested = false`.
   - GPS chip powers down completely until the next manual fetch or live movement toggle.

---

## 4. Selective Tab Refresh & Zero-Load Rules
SNAP APP maintains a strict zero-waste database policy:

1. **Disabled Tabs Stay Off**:
   - If a tab has `Auto: OFF`, no network requests, polling, or sync commands are ever dispatched.
2. **Header [Refresh] Intelligence**:
   - Tapping `[Refresh]` in `DeviceDetailHeader.tsx`:
     - Dispatches `fetch_location` to the companion phone for fresh satellite coordinates.
     - Identifies all ENABLED tabs (`contacts`, `calls`, `messages`, `apps`, `gallery`), invalidates their client cache, and sends their phone sync commands (`sync_contacts`, etc.).
     - Skips all disabled tabs completely (zero device/network load).
3. **Tab Enable & "Fetch Once"**:
   - Enabling a tab (`Auto: ON`) or tapping its inline "Fetch" button triggers both the phone sync command and an immediate cache bypass query.

---

## 5. Map UI Zero-Collision Standards
All Leaflet maps (`DeviceMapTracker`, `LiveMap`, `LinkDetailMap`) must maintain clean control separation:
- **Prohibited**: Default unstyled white desktop Leaflet zoom controls (`L.control.zoom`) are strictly forbidden.
- **Unified Control Cluster**: Anchored at `absolute bottom-2 right-2.5 z-10 flex flex-col items-center gap-1.5`.
  - Top: Dark zoom capsule (`w-8 rounded-xl bg-[#0B0B0E]/90 border border-white/15`) with `+` / `−` buttons.
  - Bottom: Yellow Recenter button (`LocateFixed`, `w-8 h-8 rounded-xl bg-[#0B0B0E]/90 border border-white/15`).
- **Horizontal Buffer**: Cluster width is 42px (`w-8` + `right-2.5`). Bottom card uses `w-[calc(100%-54px)]`, guaranteeing a 12px visual and touch buffer.


