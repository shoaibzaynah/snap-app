# Rule 15: Live Location Architecture — Battery + DB Optimization

## Overview
Live location uses a **dual-delivery** model: Supabase Broadcast for instant map animation + Postgres Changes on `monitored_devices` as primary reliable notification.

---

## DB Architecture (Zero Table Bloat)

| Table | Purpose | Write Pattern |
|---|---|---|
| `monitored_devices.current_latitude/longitude/accuracy` | **Current** live position (1 row per device) | **UPDATE** every location change |
| `device_locations` | **History** path trail (map polyline) | **INSERT** only when moved >30m (normal and live mode to prevent GPS drift noise) |

> **Critical Rule**: NEVER insert to `device_locations` on every heartbeat — would create 4,300+ rows/day per device. Always check distance threshold first (>30m).

---

## Android Location Service

### Battery Tradeoff Settings
| Mode | Interval | Min Distance | DB Persist | Use Case |
|---|---|---|---|---|
| **Normal** (heartbeat) | 20s poll | 30m threshold | UPDATE `monitored_devices` + conditional INSERT history | Default always-on |
| **Live Movement** | 3-5s continuous | 30m threshold | UPDATE `monitored_devices` always + INSERT history every 30s only | Parent actively watching map |

### `CompanionSyncService.java` Flow
```
Every 20s heartbeat:
  → requestActiveLocationFix()
  → GPS/Network/Passive provider → best location
  → dispatchLocation(loc)
    → if liveMovement: POST /api/device-sync/live-location (persist=true only every 30s)
    → else: POST /api/device-sync/location (always persists if moved >30m)
```

### Battery Safety
- `FusedLocationProviderClient` equivalent via `LocationManager` (no Google Play dependency)
- GPS hardware powered OFF between fixes in normal mode
- Live movement uses `PASSIVE_PROVIDER` as fallback (zero extra battery)
- `lastPersistTime` throttle prevents DB write storm in live mode

---

## Dashboard Realtime Subscriptions (Dual Channel)

### 1. Postgres Changes on `monitored_devices` (PRIMARY)
```typescript
supabase.channel('pg-location:{deviceId}')
  .on('postgres_changes', {
    event: 'UPDATE', table: 'monitored_devices',
    filter: 'id=eq.{deviceId}'
  }, (payload) => {
    // Update map marker from payload.new.current_latitude/longitude
  })
```
- **Reliable**: Works as long as Realtime is enabled on `monitored_devices` table
- **Latency**: ~200ms (DB write + CDC + WebSocket)
- **Fires on**: Every heartbeat location update + every live-location update

### 2. Broadcast on `device-live:{deviceId}` (BACKUP — live mode only)
```typescript
supabase.channel('device-live:{deviceId}')
  .on('broadcast', { event: 'location' }, (payload) => {
    // Instant map animation from payload
  })
```
- **Ultra-fast**: <50ms (no DB involved)
- **Only active**: When parent clicks "Enable Live Movement"
- **Risk**: Can miss signals if Realtime momentarily disconnects

### Why Dual?
- Postgres Changes ensures **zero missed locations** (DB is source of truth)
- Broadcast ensures **zero visual lag** during active live tracking
- Dashboard deduplicates by coordinates (ignores if same lat/lng as last)

---

## API Routes

| Route | Input | Action |
|---|---|---|
| `/api/device-sync/location` | `{device_id, lat, lng, accuracy, battery}` | UPDATE monitored_devices + conditional INSERT history (>30m) |
| `/api/device-sync/live-location` | `{device_id, lat, lng, accuracy, persist}` | UPDATE monitored_devices + Broadcast + conditional INSERT history (>30m, only if persist=true) |

---

## Verified on Supabase (via API)

- ✅ `monitored_devices` has `current_latitude`, `current_longitude`, `current_accuracy`, `location_updated_at` columns
- ✅ `monitored_devices` is in `supabase_realtime` publication → Postgres Changes will fire
- ✅ `device_locations` is in `supabase_realtime` publication → history changes also fire
- ✅ Broadcast API returns HTTP 202 → Broadcast channels working
