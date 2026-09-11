# Rule 12: Client-Side In-Memory Caching & Instant Refresh (Rule 22)

To guarantee zero unnecessary database load, minimal mobile battery/data usage, and instantaneous (<10ms) tab switching:

## 1. In-Memory Cache Layer (5-Minute TTL)
- All heavy telemetry datasets (Media Gallery, Contacts, Call logs, SMS messages, Installed Apps) must be cached in memory on the client for 5 minutes (`CACHE_TTL = 300000`).
- Switching between tabs must read instantly from the in-memory cache without issuing repetitive database queries or showing loading spinners.
- **AbortController**: When switching tabs rapidly, in-flight requests for the previous tab must be aborted to prevent race conditions and stale data.

## 2. Instant Cache Busting on "Refresh Hub"
- When the user clicks the header **"Refresh Hub"** button or reloads the browser, the in-memory cache is immediately cleared.
- A fresh synchronized request is dispatched to fetch the latest device state, real GPS triangulation, and active tab data.

## 3. Persistent Tab Header Badges
- Tab header badges must always display authoritative server count metrics (`device.counts.*`) rather than uninitialized local state arrays.
- Guarantees accurate count badges (e.g. `Gallery (47)`, `Contacts (331)`, `Apps (169)`) at all times.

## 4. Per-Tab Loading State
- Each tab must have its own loading indicator (`tabLoading`) to show progress and prevent "stuck" appearance.
- Gallery tab has dedicated `filesLoading` state due to larger payload sizes.

## 5. Enable/Disable Tab Auto-Fetch
- Each data tab has a toggle: "Auto-Fetch Enabled/Disabled" stored in `localStorage`.
- When disabled: no API requests fired, cached data shown, no sync commands sent.
- Prevents unwanted data fetching and reduces device/server load.

## 6. Universal 5-Second Fetch Cooldown (Anti-Spam & Zero DB Write Storms)
- Every on-demand "Fetch" button across all device tabs MUST enforce a strict 5-second countdown timer (`Fetch (5s)` -> `Fetch`).
- During cooldown, the button is disabled to prevent repeated rapid clicks, database write storms, and unnecessary companion device wakeups.
- Any future tab created must adopt this universal 5-second cooldown `DeviceFetchButton` pattern.
