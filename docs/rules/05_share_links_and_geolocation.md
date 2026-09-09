# Rule 05: Public Share-Links, OpenGraph Previews & Geolocation Flow

## 1. Public Share-Link Route
Public route: `/view/[slug]` using cryptographically random non-sequential slugs.

Supported Link Modes:
- **Image Snap Mode**: Upload snap image/audio to storage, require location, render Snapchat story viewer after consent.
- **Target URL Redirect Mode**: Bridge/tracking link for any target URL (YouTube, TikTok, Instagram, Facebook, Snapchat, or custom web link).
- **Hybrid Mode**: Show custom uploaded image preview + redirect to destination URL post-consent.

## 2. Rich Social Link Previews (OpenGraph Scraper)
- Next.js server-side `generateMetadata` serves authentic OpenGraph tags (`og:title`, `og:description`, `og:image`, `og:site_name`, `twitter:card`).
- Crawlers (WhatsApp, Instagram DM, Facebook, Telegram, iMessage) fetch realistic previews matching the destination target content.
- Admin endpoint `/api/metadata` automatically scrapes metadata from target URLs upon creation.

## 3. Visitor Click & Geolocation Flow
1. Validate slug, active status, and expiration.
2. Visitor lands on `/view/[slug]` displaying authentic Snapchat-styled bridge interface.
3. If location is required, display the native Snapchat disclosure modal:
   *"Your location is required to view this image. By allowing location access, your current location will be shared with the link owner."*
4. Visitor clicks *"Allow Location & View / Continue"*.
5. Browser Geolocation API triggers `navigator.geolocation.getCurrentPosition()`.
6. On success:
   - Create location session in `location_sessions` (capturing IP, user agent, OS, browser, battery level).
   - Record coordinates in `location_updates`.
   - Realtime telemetry notifies admin map immediately.
7. Post-Consent Resolution:
   - If `target_url` is present: automatically redirect visitor to genuine destination (`window.location.href = target_url`) with fallback button.
   - If `target_url` is not set: reveal image/media in full Snapchat story viewer format.
8. If active tracking enabled, maintain `watchPosition()` during active session.
9. Denied/unavailable/expired/inactive states must NEVER reveal protected content or redirect.
