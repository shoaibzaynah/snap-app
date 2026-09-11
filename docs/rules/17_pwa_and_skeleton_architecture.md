# Rule 17: PWA Native Immersion & Universal Skeleton Architecture

> **MANDATORY AGENT DIRECTIVE**: This document is the single canonical source of truth for all PWA offline technologies and Skeleton loading systems across SNAP APP. Whenever ANY change, route addition, route removal, or update is made to PWA or Skeleton systems, the agent MUST update this file and preserve all standards documented below.

---

## 1. Master File Registry & Purpose Matrix

Every file involved in the Skeleton and PWA offline architecture is registered below with its precise responsibility:

| File Path | Core Purpose & Functionality |
|---|---|
| [`components/ui/Skeleton.tsx`](file:///Users/shoaib/Desktop/SNAP%20APP/components/ui/Skeleton.tsx) | **Universal UI Primitives**: Exports `<Skeleton>`, `<CardSkeleton>`, `<TableRowSkeleton>`, and `<MapCanvasSkeleton>`. Enforces adaptive light mode contrast (`bg-slate-200/90 border-slate-300/60 shadow-sm backdrop-blur-sm`) and dark mode shimmer (`dark:bg-white/[0.08] dark:border-white/10`). Zero 3rd-party npm dependencies. |
| [`public/sw.js`](file:///Users/shoaib/Desktop/SNAP%20APP/public/sw.js) | **Service Worker (v3)**: Intercepts navigation requests (`request.mode === 'navigate'`) to serve cached pages or `/offline.html` (HTTP 200), preventing iOS Safari and Android Chrome from dropping out of standalone immersion. Shields Next.js RSC requests (`_rsc`) to prevent hard reload crashes. |
| [`public/offline.html`](file:///Users/shoaib/Desktop/SNAP%20APP/public/offline.html) | **Self-Contained Offline Shell**: 100% standalone zero-dependency HTML. Embedded CSS, inline Snapchat Ghost SVG, pure CSS pulsing skeletons, and active 1.5s heartbeat recovery script. Renders with 0% network and zero JS bundle dependencies (guarantees zero black screens). |
| [`components/ui/NetworkStatus.tsx`](file:///Users/shoaib/Desktop/SNAP%20APP/components/ui/NetworkStatus.tsx) | **In-App Screen Keep-Alive & Floating Toast**: Mounts in root layout. Registers & updates `/sw.js`. Detects offline state without navigating away from current view. Displays top floating status pill (`[ ⚠️ Offline Mode ]` / `[ ⚡ Connected ]`). Runs 1.5s recovery heartbeat. |
| [`app/offline/page.tsx`](file:///Users/shoaib/Desktop/SNAP%20APP/app/offline/page.tsx) | **In-App Offline Route**: Next.js route fallback for `/offline` with Snapchat branding, skeleton silhouettes, and 1.5s heartbeat auto-recovery. |
| [`public/manifest.json`](file:///Users/shoaib/Desktop/SNAP%20APP/public/manifest.json) | **Static PWA Manifest**: Declares `display: "standalone"`, `display_override: ["standalone", "window-controls-overlay"]`, `start_url: "/admin"`, theme color, and icons. |
| [`app/manifest.ts`](file:///Users/shoaib/Desktop/SNAP%20APP/app/manifest.ts) | **Dynamic PWA Manifest**: Next.js App Router metadata manifest with matching standalone configuration and maskable icons. |
| [`app/layout.tsx`](file:///Users/shoaib/Desktop/SNAP%20APP/app/layout.tsx) | **Root Shell**: Injects Apple WebApp meta tags (`black-translucent`), manifest link, and mounts `<NetworkStatus />` universally across all routes. |
| [`app/admin/loading.tsx`](file:///Users/shoaib/Desktop/SNAP%20APP/app/admin/loading.tsx) | **Dashboard Route Loader**: Instant skeleton placeholder for overview KPI cards, action banner, and recent links table. |
| [`app/admin/devices/loading.tsx`](file:///Users/shoaib/Desktop/SNAP%20APP/app/admin/devices/loading.tsx) | **Devices Route Loader**: Instant skeleton placeholder for kid device cards grid, status counters, and action pills. |
| [`app/admin/devices/[id]/loading.tsx`](file:///Users/shoaib/Desktop/SNAP%20APP/app/admin/devices/%5Bid%5D/loading.tsx) | **Device Hub Route Loader**: Instant skeleton placeholder for device telemetry header, tab bar, and radar map canvas. |
| [`app/admin/links/loading.tsx`](file:///Users/shoaib/Desktop/SNAP%20APP/app/admin/links/loading.tsx) | **Links Route Loader**: Instant skeleton placeholder for tracking links table rows and header. |
| [`app/admin/locations/loading.tsx`](file:///Users/shoaib/Desktop/SNAP%20APP/app/admin/locations/loading.tsx) | **Live Locations Route Loader**: Instant skeleton placeholder for full CARTO/Satellite map radar canvas and telemetry groups. |

---

## 2. Universal Skeleton Rules (Zero CLS & Dual-Theme Contrast)
1. **Zero Cumulative Layout Shift (CLS = 0)**: Skeletons must strictly reserve the exact dimensions of real elements.
2. **Anti-Spinner / Anti-Text Rule**: Never show solitary spinners (`Loader2`, `animate-spin`) or raw text (`<div>Loading...</div>`). Always use `@/components/ui/Skeleton` primitives.
3. **Adaptive Contrast Standard**:
   - **Light Mode**: `bg-slate-200/90 border border-slate-300/60 shadow-sm backdrop-blur-sm`. Never use pure white opacity on light backgrounds.
   - **Dark Mode**: `dark:bg-white/[0.08] dark:border-white/10` with hardware-accelerated `animate-pulse`.
   - **Card Containers**: `bg-white dark:bg-[#141418] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl`.

---

## 3. PWA Standalone Immersion & Zero-Black-Screen Rules
1. **Anti-Browser-Drop Mandate**: Standalone PWAs on iOS and Android must never drop into browser chrome (revealing URL headers or Safari error screens).
2. **Zero-Black-Screen Mandate**: When offline, the service worker must NEVER return raw unstyled text (`new Response("Offline")`) or an unbundled React page. It must serve `public/offline.html` or the embedded `FALLBACK_HTML` template.
3. **Active Heartbeat Auto-Recovery (1.5s Poller)**: Standalone WebKit frequently fails to fire the window `'online'` event. An active 1.5s interval ping to `/api/companion/version` is mandatory in `offline.html` and `NetworkStatus.tsx` to automatically reload into live view within 1.5s of signal return without user intervention.
4. **Screen Keep-Alive**: When network drops while a user is on an active view, do NOT navigate them away or reload. Keep their screen, maps, and telemetry intact, and display the floating toast: `[ ⚠️ Offline Mode — Auto Reconnecting ]`.

---

## 4. Agent Lifecycle Checklist for New Pages, Updates, & Deletions
Whenever adding, updating, or removing any page:
1. **When Adding a Page** (e.g. `app/admin/<new-route>/page.tsx`):
   - MUST create `app/admin/<new-route>/loading.tsx` using `@/components/ui/Skeleton`.
   - Update Section 1 of this file to register the new `loading.tsx` path and purpose.
2. **When Modifying In-Page Data Fetching**:
   - Wrap loading state in `<TableRowSkeleton />` or `<CardSkeleton />`.
3. **When Removing a Page**:
   - Remove its corresponding `loading.tsx` file and clean its entry from Section 1 table.
4. **Verify Rule 14**: Run `wc -l` on all modified files to ensure every file stays strictly `<= 200 lines`.
