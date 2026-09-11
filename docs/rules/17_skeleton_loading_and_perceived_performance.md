# Rule 17: Skeleton Loading Architecture & Perceived Performance

## 1. Core Engineering Mandate (Anti-Spinner Rule)
Every page, tab, route transition, table, and telemetry feed across SNAP APP MUST use structural **Skeleton Loading** instead of blank screens or solitary spinning loaders (`Loader2`, `animate-spin`):
- **Native Instagram/Facebook Feel**: Users must instantly see the layout silhouette (cards, headers, tables, map canvas) the moment they tap a navigation link or tab.
- **Zero Cumulative Layout Shift (CLS = 0)**: Skeletons must strictly reserve the exact height and width of the target content to eliminate UI jumping when data resolves.

---

## 2. Universal Reusable Primitives (`components/ui/Skeleton.tsx`)
Never import third-party skeleton libraries (npm bloat is forbidden). All pages must strictly use the canonical lightweight primitives from `@/components/ui/Skeleton`:
1. `<Skeleton className="..." />`: Base adaptive shimmer capsule (supports custom dimensions, rounded shapes, and dark/light adaptive opacity).
2. `<CardSkeleton count={N} />`: Multi-column metric and KPI card placeholders.
3. `<TableRowSkeleton rows={N} />`: Standard telemetry, link directory, and activity table row placeholders.
4. `<MapCanvasSkeleton height="..." />`: Leaflet radar canvas placeholder with pulsing Snapchat locator pin.

---

## 3. Mandatory Next.js Route Loaders (`loading.tsx`)
Every present and future route folder under `app/admin/` MUST contain an atomic `loading.tsx` file:
- `/admin/loading.tsx`: Overview KPI cards and recent activity skeleton.
- `/admin/devices/loading.tsx`: Device cards grid and status row skeleton.
- `/admin/devices/[id]/loading.tsx`: Device telemetry header, tab bar, and sensor canvas skeleton.
- `/admin/links/loading.tsx`: Share links directory table skeleton.
- `/admin/locations/loading.tsx`: Global map canvas and telemetry group skeleton.

---

## 4. Anti-Nuqsan Protocols (Edge Case Protections)
1. **Zero-Flicker Protection (Fast Networks)**:
   - If data resolves in under 100ms, UI transitions must utilize CSS opacity smoothing (`transition-opacity duration-300 ease-in-out`) rather than abrupt visual cuts.
2. **Zero Maintenance Overhead (Dynamic Layouts)**:
   - Do NOT construct custom ad-hoc skeleton DOM trees for minor tweaks. Assemble layouts using the 4 standard primitives (`Skeleton`, `CardSkeleton`, `TableRowSkeleton`, `MapCanvasSkeleton`).
3. **Adaptive Dark/Light Contrast & Modern Blur**:
   - Light Mode: Must strictly use `bg-slate-200/90 border border-slate-300/60 shadow-sm backdrop-blur-sm` so skeletons are prominently visible with tactile depth on white/light surfaces. Never use pure white opacity on white backgrounds.
   - Dark Mode: Uses `dark:bg-white/[0.08] dark:border-white/10` with hardware-accelerated `animate-pulse` for deep obsidian cards.

---

## 5. PWA Native Immersion & Offline Resiliency (Anti-Browser-Drop Rule)
To prevent iOS Safari and Android Chrome from revealing browser URL headers or showing native browser network error screens ("Safari can't open page because iPhone is not connected to internet"):
1. **Service Worker Navigation Interception (`public/sw.js`)**:
   - All navigation requests (`request.mode === 'navigate'`) MUST be caught by the service worker.
   - If offline, the service worker immediately responds with the pre-cached `/offline` shell (HTTP 200), ensuring WebKit never registers a network failure and never exits full-screen standalone immersion.
2. **Snapchat-Native Offline Shell (`app/offline/page.tsx`)**:
   - Renders a brand-consistent offline state with Snapchat Ghost logo, amber status badge, preserved layout skeleton silhouette (`<CardSkeleton />`), and an auto-reconnecting listener (`window.addEventListener('online')`).
3. **Universal Network Status Toast (`components/ui/NetworkStatus.tsx`)**:
   - Real-time offline pill slides down from the top: `⚠️ Offline Mode — Auto Reconnecting`.
   - On reconnection: flashes green `⚡ Connected — Back Online` for 3 seconds before auto-dismissing.
   - Automatically registers `/sw.js` safely on client mount across all devices.
