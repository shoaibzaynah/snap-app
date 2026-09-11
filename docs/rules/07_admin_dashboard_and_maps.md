# Rule 07: Canonical Leaflet Map System, Smart Chips, & Overlays

> **MANDATORY AGENT DIRECTIVE**: Every map across SNAP APP (`LiveMap.tsx`, `DeviceMapTracker.tsx`, `LinkDetailMap.tsx`, and future map views) MUST strictly share identical map engines, compact `h-6` chips, glowing Snapchat Ghost markers, floating bottom cards, and external navigation redirects. No ad-hoc map styling is permitted.

---

## 1. Master Map Files Registry & Responsibilities

| File Path | Core Purpose & Architecture Role |
|---|---|
| [`lib/map-utils.ts`](file:///Users/shoaib/Desktop/SNAP%20APP/lib/map-utils.ts) | **Canonical Map Engine**: Centralizes CARTO Retina `@2x` 512px tiles (`cb1_30vw_1_58aea214346da718249bc931`), Google Hybrid HD Satellite (`scale=2` native 512px), Snapchat Ghost pin (`createSnapGhostIcon`), accuracy circles, and Google Maps external URL generator. |
| [`components/admin/LiveMap.tsx`](file:///Users/shoaib/Desktop/SNAP%20APP/components/admin/LiveMap.tsx) | **Global Radar Map**: Renders live visitor sessions and kid devices on `/admin/locations`. Features dual-mode layer switcher, active GPS count chips, and bottom telemetry sheet. |
| [`components/admin/devices/DeviceMapTracker.tsx`](file:///Users/shoaib/Desktop/SNAP%20APP/components/admin/devices/DeviceMapTracker.tsx) | **Child Safety Radar**: Dedicated live GPS tracker for kid devices under `/admin/devices/[id]`. Features live 3s movement toggle, fetch button, distance calculation, and recenter controls. |
| [`components/admin/LinkDetailMap.tsx`](file:///Users/shoaib/Desktop/SNAP%20APP/components/admin/LinkDetailMap.tsx) | **Tracking Link Audit Map**: Renders audit coordinates for a single link under `/admin/links/[id]`. Matches identical HUD layout and compact chip standards. |
| [`components/ui/Skeleton.tsx`](file:///Users/shoaib/Desktop/SNAP%20APP/components/ui/Skeleton.tsx) | **Map Placeholder (`MapCanvasSkeleton`)**: Renders an animated radar canvas with glowing Snapchat Ghost pin while Leaflet asynchronously mounts. |

---

## 2. Canonical Top HUD & Single-Row Smart Chips (`h-6` Standard)
All map canvases must position controls in a unified single top row without wrapping, cropping, or vertical stacking:
- **Top Row Geometry**: `absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none gap-1`.
- **Strict Height**: All chips are strictly **`h-6` (24px)** capsules (`px-2 rounded-md text-[10px] font-bold`).
- **Status Chip (Left)**:
  - `[• GPS]` or `[• Live 3s]` with pulsing emerald (`bg-emerald-400`) or amber dot.
  - Background: `bg-[#0B0B0E]/90 backdrop-blur-md border border-white/10 text-white`.
- **Mode Toggle Chip**:
  - `[• Track]` or `[• Live Tracking]`. Active state: `bg-emerald-500/20 border-emerald-500/40 text-emerald-300`.
- **Action Chip**:
  - `[Fetch]` button with `RefreshCw` icon (`text-[#FFFC00] active:scale-95`).
- **Layer Switcher (Right)**:
  - Anchored top-right: `h-6 flex items-center bg-[#0B0B0E]/90 backdrop-blur-md border border-white/10 rounded-md p-0.5`.
  - Buttons: `[Streets | Satellite]` with `Layers` and `Globe` icons. Active state: `bg-[#FFFC00] text-black font-black`.

---

## 3. Canonical Icons & Glowing Snapchat Ghost Marker
1. **Primary Marker Pin**:
   - MUST use `createSnapGhostIcon(L)` from `lib/map-utils.ts` (Snapchat Ghost SVG with ambient yellow pulse).
   - Standard blue Leaflet teardrop pins are **strictly FORBIDDEN**.
   - **Single Pin Rule**: Render exactly ONE primary ghost pin at the latest live coordinate. Historical coordinates render as small yellow breadcrumbs (`createHistoryDotIcon(L)`).
2. **Admin Location Marker**:
   - Blue pulsing compass dot (`createAdminLocationIcon(L)`) showing admin position.
3. **Floating Recenter Button**:
   - Anchored at `bottom-20 right-2.5`, `w-9 h-9 rounded-2xl bg-[#0B0B0E]/90 backdrop-blur-xl border border-white/15 text-[#FFFC00] shadow-xl active:scale-90`. Icon: `LocateFixed`.

---

## 4. Canonical Bottom Floating Info Card & Protected Dark Surface
1. **Card Placement & Styling**:
   - Anchored at `absolute bottom-3 left-3 right-3 sm:right-auto sm:w-80 z-10`.
   - Surface: `bg-[#0B0B0E]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl space-y-2`.
2. **Protected Dark Surface Rule**:
   - Map overlay cards (`.snap-map-overlay`, `[data-map-overlay]`) must NEVER invert white or yellow text to black in Light Mode. All text strictly remains `#FFFFFF` or `#FFFC00` for 100% legibility over map photography.
3. **1-Click External Maps Navigation**:
   - Bottom card must provide a high-contrast Snapchat Yellow `#FFFC00` action button with bold black text: `Open in Google Maps ↗` (`https://www.google.com/maps?q=${lat},${lng}`).

---

## 5. Map Sizing & Tab Invalidation Protocol
Leaflet maps hidden inside inactive tabs (e.g. `DeviceTabViews.tsx`) do not receive DOM resize events:
- **Mandatory Invalidation**: When a user switches to the Map tab or when map container dimensions change, the component MUST call:
  ```typescript
  setTimeout(() => map.invalidateSize(), 150);
  ```
- This completely prevents gray tiles, off-center pins, and distorted canvases.

---

## 6. Agent Maintenance Protocol
Whenever modifying existing maps or creating a new map:
1. Re-use `getMapTileConfig(mode, theme)` from `lib/map-utils.ts`.
2. Copy exact top chip classes (`h-6 text-[10px] font-bold`) and bottom card layout.
3. Verify line count stays `<= 200 lines` (Rule 14) with `wc -l`.
