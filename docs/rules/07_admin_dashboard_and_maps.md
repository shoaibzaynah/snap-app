# Rule 07: Admin Dashboard & Canonical Leaflet Map System

## 1. Admin Management Routes
Admin authentication is required for all management operations via Supabase Auth matching `ADMIN_EMAIL`:
- `/admin`: Overview metrics (total images, active links, devices, live sessions)
- `/admin/images`: Create links, upload media, configure permissions & social OG metadata
- `/admin/links`: Directory of active/expired share links
- `/admin/links/[id]`: Dedicated per-link tracking audit and captured coordinates
- `/admin/devices`: Child safety device management & pairing code generator
- `/admin/devices/[id]`: Full parental telemetry hub (Live Feed, Map, Gallery, Audio, Apps, Contacts, Calls, Messages)
- `/admin/locations`: Live global visitor and device map
- `/admin/settings`: App configuration and security tokens

## 2. Canonical Shared Map Engine (`lib/map-utils.ts`)
All maps (`LiveMap.tsx`, `LinkDetailMap.tsx`, `DeviceMapTracker.tsx`) MUST use centralized utilities from `lib/map-utils.ts`:
- **Permanent CARTO High-DPI Engine**: Canonical permanent key `cb1_30vw_1_58aea214346da718249bc931` automatically requests `@2x` 512px Retina tiles with `maxZoom: 20` for razor-sharp roads, building outlines, and labels without blur or watermarks.
- **Dynamic Dark/Light Synchronization**: Maps dynamically switch between `dark_all` in Dark mode and `light_all` in Light mode via `getDarkTileLayerConfig(theme)`.
- **Canonical Glowing Snapchat Ghost Locator**: All maps must strictly use `createSnapGhostIcon(L)` and `createSnapAccuracyCircle(L)` from `lib/map-utils.ts`.
- **Single Marker Pin Rule**:
  - Never stack multiple ghost icons. Render **exactly ONE glowing Snapchat Ghost marker** at the live/latest coordinate.
  - Render historical movement as sleek yellow breadcrumb dots.
  - Call `map.invalidateSize()` whenever tabs switch or containers resize.
- **1-Click Google Maps External Navigation**:
  - Every coordinate popup and map header must provide a 1-click redirect to Google Maps: `https://www.google.com/maps?q=${lat},${lng}`.

## 3. High-Definition Satellite & Unified HUD Overlays
- **Google Hybrid Satellite Engine**: Satellite layer uses Google Hybrid (`https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}`, subdomains `0123`, `maxZoom: 21, maxNativeZoom: 20, detectRetina: false`) providing sharp, readable road/place labels globally without "Map data not yet available" dropouts.
- **Unified Map HUD Top-Row Alignment**:
  - Top-Left (`top-2 left-2`): Status pills (pin counts, tracking status, fetch button).
  - Top-Right (`top-2 right-2`): Compact Streets/Satellite layer switcher aligned on the exact same row.
  - Bottom-Right (`bottom-20 right-2.5`): Floating 1-click re-center button (`LocateFixed`).
  - No link title pills inside map canvases (filter and context situated externally).
- **Protected Dark Surface Rule**:
  - Map overlays (`.snap-map-overlay`, `[data-map-overlay]`), video feeds (`.bg-black`, `[data-dark-surface]`), and media player pills must NEVER invert white or yellow text to black in Light Mode. All dark surfaces strictly maintain `#FFFFFF` or `#FFFC00` text for 100% legibility.
