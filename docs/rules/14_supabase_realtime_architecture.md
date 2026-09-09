# Rule 14: Supabase Realtime Architecture — What's ON, What's OFF, Why

## Realtime Has 2 Separate Mechanisms

| Mechanism | Use Case | How It Works |
|---|---|---|
| **Broadcast Channel** | WebRTC signaling, instant command push, media upload notifications | Direct message relay between clients. **No DB involved.** Fastest (<50ms) |
| **Postgres Changes** | Live location map, command status, device online/offline | Subscribes to DB row INSERT/UPDATE/DELETE events. Slightly slower (~200ms) |

> **Key Insight**: Broadcast = direct signal relay (like WhatsApp message). Postgres Changes = DB trigger notification (like email notification on new order).

---

## Current Supabase Realtime Configuration (Verified via API)

### ✅ Broadcast Channels (Always ON — no per-table config needed)

| Channel Pattern | Purpose | Used By |
|---|---|---|
| `webrtc:{deviceId}` | WebRTC SDP offer/answer/ICE exchange | `signaling/route.ts` ↔ `RealtimeSocketManager.java` |
| `device:{deviceId}` | Instant commands + media upload notifications | `upload-photo/route.ts`, `upload-audio/route.ts`, `upload-file/route.ts` → dashboard `useDeviceDetail.ts` |
| `device-live:{deviceId}` | High-frequency live movement GPS (3s interval) | `live-location/route.ts` → `DeviceMapTracker.tsx` |

**Broadcast needs NO table-level enable** — it works as long as Supabase Realtime service is running (HTTP 202 confirmed ✅).

### ✅ Postgres Changes Tables (Enabled in `supabase_realtime` publication)

| Table | Why Realtime ON | Postgres Changes Use |
|---|---|---|
| `device_commands` | Dashboard sees command status change (pending→sent→executed) | Auto-refresh snaps/audio when command completes |
| `device_locations` | Parent dashboard live map marker moves when new location row inserted | Map pin live update without manual refresh |
| `device_live_sessions` | Track WebRTC session status (requesting→active→ended) | Show live stream connection status |
| `device_files` | When phone uploads file, `storage_path` updates from null→URL | Gallery shows "READY" badge instantly |
| `monitored_devices` | Device online/offline, battery level, last_seen changes | Header status badge live update |
| `location_updates` | Legacy location tracking (share links) | Visitor location map |

### ❌ Tables NOT in Realtime (Intentionally OFF — no live updates needed)

| Table | Why OFF |
|---|---|
| `device_contacts` | Bulk sync only, no live tracking needed |
| `device_calls` | Bulk sync only |
| `device_messages` | Bulk sync only |
| `device_installed_apps` | Bulk sync only |
| `device_browsing_history` | Bulk sync only |
| `device_geofences` | Config table, rarely changes |
| `admin_settings` | Config table |
| `profiles` | Auth table, rarely changes |
| `image_links` | Share link feature, not device monitoring |
| `location_sessions` | Legacy share link sessions |

> **Why OFF?** Postgres Changes on high-write tables (contacts 8000+, SMS 10000+) would fire thousands of Realtime events per sync, overwhelming the free tier quota and slowing everything down.

---

## How Each Feature Uses Realtime

### WebRTC Live Audio/Video Signaling
```
Admin Dashboard                    Supabase                     Phone
     |                               |                           |
     |-- POST /signaling ----------->|                           |
     |   (offer SDP)                 |-- Broadcast "signal" ---->|
     |                               |   channel: webrtc:{id}    |
     |                               |                           |
     |                               |<-- POST /signaling -------|
     |<-- Broadcast "signal" --------|   (answer SDP)            |
     |   channel: webrtc:{id}        |                           |
     |                               |                           |
     |============ P2P WebRTC Connected (Supabase not involved) =|
```

### Live Location Map
```
Phone GPS                          Supabase                     Dashboard
     |                               |                           |
     |-- POST /live-location ------->|                           |
     |   {lat, lng, accuracy}        |-- Broadcast "location" -->|
     |                               |   channel: device-live:{id}
     |                               |                           |
     |   (if persist=true)           |-- INSERT device_locations  |
     |                               |-- Postgres Changes ------>|
     |                               |   (backup notification)   |
```
> Live location uses **BOTH**: Broadcast for instant (<50ms) + Postgres Changes as backup when Broadcast misses.

### Media Upload Notification
```
Phone uploads photo               Supabase                     Dashboard
     |                               |                           |
     |-- POST /upload-photo -------->|                           |
     |   (multipart file)            |-- Store in Storage        |
     |                               |-- Update device_commands  |
     |                               |-- Broadcast "snap_uploaded"->|
     |                               |   channel: device:{id}    |
     |                               |                           |-- Auto refresh gallery
```
