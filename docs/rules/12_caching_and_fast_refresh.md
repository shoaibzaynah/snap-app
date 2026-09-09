# Rule 12: Client-Side In-Memory Caching & Instant Refresh (Rule 22)

To guarantee zero unnecessary database load, minimal mobile battery/data usage, and instantaneous (<10ms) tab switching:

## 1. In-Memory Cache Layer (5-Minute TTL)
- All heavy telemetry datasets (Media Gallery, Contacts, Call logs, SMS messages, Installed Apps) must be cached in memory on the client for 5 minutes (`tabCache`).
- Switching between tabs must read instantly from the in-memory cache without issuing repetitive database queries or showing loading spinners.

## 2. Instant Cache Busting on "Refresh Hub"
- When the user clicks the header **"Refresh Hub"** button or reloads the browser, the in-memory cache is immediately cleared.
- A fresh synchronized request is dispatched to fetch the latest device state, real GPS triangulation, and active tab data.

## 3. Persistent Tab Header Badges
- Tab header badges must always display authoritative server count metrics (`device.counts.*`) rather than uninitialized local state arrays.
- Guarantees accurate count badges (e.g. `Gallery (47)`, `Contacts (331)`, `Apps (169)`) at all times, preventing tab badges from ever resetting to `(0)` upon refresh.
