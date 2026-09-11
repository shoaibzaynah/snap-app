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
3. **Adaptive Dark/Light Contrast**:
   - Shimmer surfaces utilize `bg-white/[0.07] border-white/5` with hardware-accelerated `animate-pulse`, ensuring 100% legibility on dark obsidian cards and light surfaces without manual color overrides.
