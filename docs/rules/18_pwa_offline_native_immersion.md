# Rule 18: PWA Native Immersion & Zero-Black-Screen Offline Architecture

## 1. Native App Immersion Mandate (Anti-Browser-Drop Rule)
SNAP APP running as an installed PWA on iOS (Safari WebApp) and Android (Chrome Standalone) must NEVER feel like a web page:
- **No Browser URL Bars**: The browser chrome header (e.g. `snap-app-chi.vercel.app`) must NEVER drop down on network disconnection.
- **No Native Error Screens**: Safari's native *"Safari can't open page because iPhone is not connected to internet"* or Chrome's dinosaur page must NEVER appear.
- **No Pitch-Black Screens**: A network drop must NEVER cause a blank/dead black screen.

---

## 2. Zero-Black-Screen Root Cause & Architectural Fix
- **Root Cause**: When a device goes offline and attempts a navigation or Next.js RSC fetch, returning a raw text response (`new Response("Offline")`) or an unhydrated React page causes a completely dead black page with zero JavaScript execution.
- **The Fix**:
  1. `public/offline.html`: A 100% self-contained static HTML shell with embedded CSS, inline SVG Snapchat Ghost logo, pure CSS pulsing skeletons, and inline auto-reconnect JavaScript. Zero external JavaScript chunk dependencies.
  2. `public/sw.js` (Service Worker): Pre-caches `/offline.html`. When navigation fails offline, it intercepts the request and serves the cached offline shell with HTTP 200 OK. WebKit never registers a network error and stays in full-screen standalone immersion.
  3. `FALLBACK_HTML` embedded constant: Even if the Service Worker cache is somehow empty, an inline HTML fallback string is served instead of raw unstyled text.

---

## 3. Active Heartbeat Auto-Recovery Protocol (1.5s Poller)
iOS Safari WebKit in standalone PWA mode frequently DOES NOT fire the window `'online'` event when WiFi or Cellular data reconnects.
- **Mandatory Poller**: Both `public/offline.html` and `components/ui/NetworkStatus.tsx` run an active 1.5-second heartbeat check:
  ```javascript
  setInterval(() => {
    if (navigator.onLine) {
      fetch('/api/companion/version', { method: 'HEAD', cache: 'no-store' })
        .then(() => window.location.href = '/admin')
        .catch(() => {});
    }
  }, 1500);
  ```
- As soon as signal returns, the user is automatically returned to the live dashboard without needing to touch any buttons.

---

## 4. In-App Screen Keep-Alive Protocol (`components/ui/NetworkStatus.tsx`)
When a user is actively viewing a screen and the internet disconnects:
- **Never Navigate Away**: Keep their current screen, coordinates, maps, and device telemetry intact.
- **Floating Status Pill**: Display an in-app non-intrusive floating pill at top center:
  `[ ⚠️ Offline Mode — Auto Reconnecting ]`
- **Reconnection Green Flash**: When connection restores, flash `[ ⚡ Connected — Back Online ]` for 3.5s before smoothly auto-dismissing.
- **Next.js RSC Shielding**: In `public/sw.js`, intercept `_rsc` link clicks so offline tab taps do not trigger full browser error reloads.

---

## 5. Mandatory Agent Protocol for Updates & New Features
1. **Never Remove Service Worker**: `public/sw.js` must remain registered in `app/layout.tsx` via `<NetworkStatus />`.
2. **Never Break `offline.html` Autonomy**: Do NOT add external `<script src="...">` to `public/offline.html`. It must remain 100% standalone.
3. **PWA Manifest Integrity**: Maintain `display: "standalone"`, `scope: "/"`, and `start_url: "/admin"` in `public/manifest.json` and `app/manifest.ts`.
4. **Verify Line Limits (Rule 14)**: All related files must remain strictly `<= 200 lines`.
