# Rule 17: Skeleton Loading Architecture & Perceived Performance

## 1. Core Engineering Mandate (Anti-Spinner Rule)
Every page, tab, route transition, table, and telemetry feed across SNAP APP MUST use structural **Skeleton Loading** instead of blank screens, raw text ("Loading..."), or solitary spinning loaders (`Loader2`, `animate-spin`):
- **Native Instagram/Facebook Feel**: Users must instantly see the layout silhouette (cards, headers, tables, map canvas) the moment they tap a navigation link or tab.
- **Zero Cumulative Layout Shift (CLS = 0)**: Skeletons must strictly reserve the exact height and width of the target content to eliminate UI jumping when data resolves.

---

## 2. Universal Reusable Primitives (`components/ui/Skeleton.tsx`)
Never import third-party skeleton libraries (npm bloat is strictly forbidden). All pages must strictly use the canonical lightweight primitives from `@/components/ui/Skeleton`:
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

## 4. Adaptive Dark/Light Contrast & Modern Blur
- **Light Mode**: Must strictly use `bg-slate-200/90 border border-slate-300/60 shadow-sm backdrop-blur-sm` so skeletons have clear tactile depth on white surfaces. Never use pure white opacity on white backgrounds.
- **Dark Mode**: Uses `dark:bg-white/[0.08] dark:border-white/10` with hardware-accelerated `animate-pulse` for deep obsidian cards.
- **Card Containers**: Must use adaptive classes `bg-white dark:bg-[#141418] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl`.

---

## 5. Mandatory Agent Protocol for New & Modified Pages
Whenever adding a new page or modifying an existing page:
1. **Always add `loading.tsx`**: Create `app/admin/<new-page>/loading.tsx` matching the page's exact layout.
2. **Replace all inline loading states**: If `isLoading` is true, render `<TableRowSkeleton />` or `<CardSkeleton />`, never `<div>Loading...</div>`.
3. **Verify Line Limit (Rule 14)**: Run `wc -l` to ensure all created and modified files stay `<= 200 lines`.
4. **Test Both Themes**: Verify visibility in both Obsidian Dark and High-Contrast Light mode.
