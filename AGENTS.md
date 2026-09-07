# AGENTS.md — SNAP APP MASTER ENGINEERING RULES

## 1. ROLE & IDENTITY
Act as a senior full-stack engineer inside Google Antigravity IDE.
Build and maintain the complete consent-based academic image-sharing project: **SNAP APP**.

- **App Name**: **SNAP APP**
- **Brand Identity & Favicon**: Use the Snapchat SVG Ghost logo located at `public/LOGO.svg` and `public/favicon.svg` as the official app icon, favicon, and brand logo.

Primary stack:
- Next.js + TypeScript
- Tailwind CSS
- Supabase: Postgres, Storage, Realtime, Auth
- Vercel
- OpenStreetMap (Leaflet / dark tiles, zero API key required) with 1-click external redirect to Google Maps

Inspect the repository before making changes. Preserve working code.

## 2. PRIVACY / CONSENT — NON-NEGOTIABLE
This project must never implement covert tracking.
Location collection requires clear disclosure and explicit user action.

Before requesting location, show:
"Your location is required to view this image. By allowing location access, your current location will be shared with the link owner."

Use a visible button such as:
"Allow Location & View Image"

Do not bypass browser permission.
Do not use hidden APIs, fingerprinting, exploits, permission tricks, or background tracking.
Do not reveal the protected image when required location permission is denied.
Only collect updates while the active browser page/session is providing them.
Show a visible "Location sharing is active" state.
Stop watchPosition when the session ends/unmounts.

## 3. ENVIRONMENT / CREDENTIALS
The developer will provide required credentials in local `.env.local`.

**Official Token & Credential Retrieval Portals**:
- **Supabase Project URL & Keys** (Anon & Service-Role):
  `https://supabase.com/dashboard/project/_/settings/api`
- **Supabase Personal Access Token** (CLI & Management API):
  `https://supabase.com/dashboard/account/tokens`
- **GitHub Personal Access Token (PAT)** (Automated Git commits & pushes):
  `https://github.com/settings/tokens` (Create classic token with `repo` and `workflow` scopes)
- **Vercel Deployment Token** (Deployment automation):
  `https://vercel.com/account/tokens`

You MUST:
- inspect `.env.local` locally when necessary;
- use environment variables, never hardcode secrets;
- never print secret values in logs, chat, commits, or generated documentation;
- never commit `.env.local`;
- create/update `.env.example` with variable NAMES and acquisition links only;
- validate required variables at startup/build time;
- distinguish browser-safe `NEXT_PUBLIC_*` values from server-only secrets.

If Supabase credentials and other configured service credentials are present locally, use the available APIs/CLI/programmatic integrations to perform required setup automatically. Do not ask the developer to manually copy SQL or perform routine dashboard operations when an API/CLI path exists.

## 4. SUPABASE — AUTOMATION FIRST & API-DRIVEN OPERATIONS
Supabase is the single source of truth for:
- PostgreSQL database
- Storage buckets (`snap-images`)
- Realtime pub/sub (`location_updates`)
- Auth & Profiles
- Migrations & Schema

**100% API & Programmatic Automation**:
- All operations (bucket creation, bucket policies, table migrations, RLS policies, realtime publication setup) MUST be executed programmatically via Supabase APIs, `@supabase/supabase-js` SDK, or CLI.
- Never ask the developer to manually paste SQL into the Supabase dashboard or manually create storage buckets in UI.
- Implement an automated provisioning script (`scripts/setup-supabase.ts` / API route) that validates and applies:
  1. Storage bucket `snap-images` creation with allowed MIME types and size limits.
  2. Storage RLS policies for public image reading and admin upload/delete.
  3. Database tables, indexes, constraints, and RLS policies.
  4. Realtime publication on `location_updates`.
- Use migrations for every schema/database change.

Required workflow:
1. Inspect current Supabase state via API/CLI.
2. Inspect existing migrations.
3. Apply/execute changes programmatically via API/CLI.
4. Verify resulting schema and bucket permissions.
5. Update `MASTER_SCHEMA.sql` so it represents the COMPLETE CURRENT DATABASE.
6. Verify MASTER_SCHEMA against the live schema/migrations.
7. Only then continue.

Never edit the live database manually if an API/CLI migration route is available.

## 5. MASTER_SCHEMA RULE
Create one root-level file:

`supabase/MASTER_SCHEMA.sql`

This file is a complete canonical snapshot of the current database schema.

After EVERY migration:
- update MASTER_SCHEMA.sql;
- include all current tables;
- columns and types;
- primary keys;
- foreign keys;
- indexes;
- constraints;
- enums;
- functions;
- triggers;
- RLS enablement;
- RLS policies;
- relevant grants;
- storage-related database configuration when applicable;
- realtime publication configuration when applicable.

MASTER_SCHEMA.sql is not a migration.
Migrations remain immutable historical records.

Never delete old migrations merely to keep the schema clean.

If MASTER_SCHEMA and migrations disagree, stop and reconcile them before proceeding.

## 6. DATABASE DESIGN
Minimum domain tables:
- profiles
- image_links
- location_sessions
- location_updates
- admin_settings

Use UUIDs, timestamps, foreign keys and useful indexes.

`image_links` should support:
- id
- slug
- image_path
- title
- description
- is_active
- requires_location
- expires_at
- created_at
- updated_at

`location_sessions` should support:
- id
- link_id
- consent_at
- started_at
- ended_at
- status

`location_updates` should support:
- id
- session_id
- latitude
- longitude
- accuracy
- created_at

Use appropriate CHECK constraints for coordinate ranges.

## 7. RLS / SECURITY
Enable RLS on private tables.

Public visitors:
- may validate an active share link through a safe server/API flow;
- must not read location history;
- must not read other sessions;
- must not read admin records.

Authenticated authorized admins:
- must authenticate via Supabase Auth (default admin: `shoaibzaynah@gmail.com`);
- authorized only if user email matches `ADMIN_EMAIL` (configured in `.env.local` and Vercel environment variables);
- manage images/links;
- view authorized sessions and location updates;
- manage settings.

Admin Email Authorization Rule:
- The authoritative admin email is specified by `ADMIN_EMAIL` in `.env.local` and in Vercel project environment variables.
- Any attempt to access `/admin/*` without an authenticated session matching `ADMIN_EMAIL` must be redirected to `/admin/login`.
- Never expose a Supabase service-role key to the browser.
- Server-only credentials must stay server-side.

Validate all API input.
Never trust client-supplied authorization.
Add reasonable rate limiting/abuse protection where practical.

## 8. STORAGE & BUCKET PROVISIONING VIA API
Use Supabase Storage for snap images with dedicated bucket: `snap-images`.

**API Bucket Provisioning & Configuration**:
- Dedicated bucket name: `snap-images`.
- Must be auto-created programmatically via Supabase Storage API (`storage.createBucket('snap-images', { public: true, fileSizeLimit: 10485760, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] })`).
- Configure bucket permissions programmatically via RLS/API:
  - **Public Read Access**: Allowed for objects in `snap-images` bucket so active links can render snaps.
  - **Admin Full Access**: Authenticated admin / service-role allowed to insert, select, update, and delete objects.
- Validate on upload:
  - MIME type: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
  - Maximum size: 10MB
  - Generated cryptographically safe filename (UUID + sanitized extension)
- Never trust original client filenames.
- Never expose storage service-role credentials to the browser.
- Fallback support: provide signed URLs or public URLs based on bucket configuration.

## 9. SHARE-LINK FLOW
Public route:
`/view/[slug]`

Use cryptographically random non-sequential slugs.

Flow:
1. Validate slug.
2. Check active status.
3. Check expiration.
4. Show native Snapchat-style viewer UI (Snapchat yellow accents, ghost logo header, immersive snap player).
5. If location is required, show native Snapchat-styled disclosure modal.
6. User explicitly presses permission button: "Allow Location & View Image".
7. Call `navigator.geolocation`.
8. On success create secure session and record initial location.
9. Reveal image in full Snapchat story viewer format.
10. If active updates are enabled, use watchPosition while the page/session is active.
11. Stop watcher when session ends.

Denied/unavailable/expired/inactive must never reveal the protected image when location is required.

## 10. GEOLOCATION
Use standard browser Geolocation API:
- getCurrentPosition()
- watchPosition() only for the active consented session

Store only:
- latitude
- longitude
- accuracy
- timestamp
- session ID

Do not claim continuous background tracking.
iOS/Android browser behavior depends on browser permission, OS settings, HTTPS, and page lifecycle.

## 11. ADMIN DASHBOARD & AUTHENTICATION
Admin authentication is required for all management operations.

Admin Login & Access:
- Route: `/admin/login`
- Authenticated via Supabase Auth email & password.
- Verification: Session email must strictly match `ADMIN_EMAIL` (configured in local env and Vercel).
- Default admin account: `shoaibzaynah@gmail.com`

Create:
- Dashboard (`/admin`)
- Images (`/admin/images`)
- Links (`/admin/links`)
- Live Locations (`/admin/locations`)
- Sessions (`/admin/sessions`)
- Settings (`/admin/settings`)

Dashboard metrics:
- total images
- active links
- active sessions
- recent updates

Image manager:
- upload
- preview
- title
- description
- location requirement
- expiration
- activate/deactivate
- delete
- generate/copy link

Live Locations (OpenStreetMap + Google Maps Redirect):
- interactive OpenStreetMap (Leaflet / dark tiles, zero API key required)
- authorized sessions
- latest coordinate
- accuracy radius circle
- last update timestamp
- map marker with popup
- 1-click external redirect button to Google Maps (`https://www.google.com/maps?q=${lat},${lng}`) for full Google Maps navigation

Use Supabase Realtime for admin-only live updates.

## 12. FRONTEND — SNAP APP NATIVE SNAPCHAT EXPERIENCE
The public front-facing viewer (`/view/[slug]`) must look and feel EXACTLY same-to-same like a native Snapchat shared link / web snap viewer:
- **App Name**: **SNAP APP**
- **Official SVG Logo & Favicon**: Use `public/LOGO.svg` and `public/favicon.svg` in all layouts, headers, and meta tags.
- **Snapchat Visual System**:
  - Signature Snapchat yellow (`#FFFC00`) brand color for key CTAs, indicators, and rings.
  - Obsidian dark aesthetic (`#000000` / `#0f0f12`) with glassmorphic cards (`rgba(255,255,255,0.08)`).
  - Modern typography (Inter / SF Pro Display style) with sharp legibility.
- **Native Snap Viewer Elements**:
  - Top header: Snapchat Ghost SVG logo (`/LOGO.svg`), "SNAP APP" branding, creator username/handle, and a rounded pill button ("Open in Snapchat" / "Get App").
  - Story-style media frame: rounded-2xl/3xl viewport, top segmented story progress bars, creator avatar badge, timestamp indicator, sound toggle button.
  - Native Snapchat Permission Modal:
    - Floating centered/bottom sheet modal with glassmorphic backdrop blur.
    - Snapchat ghost SVG icon with glowing yellow border.
    - Non-negotiable disclosure: "Your location is required to view this image. By allowing location access, your current location will be shared with the link owner."
    - Prominent high-contrast Snapchat yellow CTA button: "Allow Location & View Image".
    - Loading spinner and graceful error/denied cards with Snapchat-style retry action.
  - Bottom action bar: rounded pill "Chat" reply mock bar, lens filter icon, and share action button.
- **Native Mobile Experience**:
  - Full-viewport `100dvh`, iOS Safari address-bar resilient.
  - Safe-area insets (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`).
  - Native touch responsiveness, swipe down to dismiss mock, and tap-and-hold gestures.
  - Responsive desktop presentation centered within an authentic mobile smartphone frame preview.

Test:
- iPhone Safari
- Android Chrome
- Android Firefox where supported
- desktop browsers

Use `100dvh`, safe-area insets and responsive sizing.

## 13. PROFESSIONAL CODE REUSE & SHARED DESIGN SYSTEM (STRICT ANTI-VIBE-CODING RULE)
Work like a senior product engineering team at scale.
Strictly reject "vibe-coded" ad-hoc, disposable, or mismatched implementations:

- **Zero "Vibe-Coded" Inconsistent UI**:
  - Never write ad-hoc, inline-styled, one-off cards, buttons, modals, or inputs across different pages.
  - Do NOT create different design languages or divergent styling across pages.
  - The entire application (public viewer, admin dashboard, modals, drawers, session tables, settings) MUST breathe the exact same native Snapchat visual identity (Snapchat yellow `#FFFC00`, obsidian surfaces `#000000`/`#0B0B0E`, rounded pills, glassmorphism).

- **Mandatory Shared UI Primitives (`components/ui/*`)**:
  - Build and strictly reuse centralized, canonical UI primitives:
    - `Button.tsx`: Snapchat yellow primary (`#FFFC00`), obsidian pill, glass button variants.
    - `Card.tsx`: Obsidian dark glass surface with border `rgba(255,255,255,0.08)`.
    - `Modal.tsx`: Native Snapchat-styled backdrop blur and bottom sheet / centered modal.
    - `Input.tsx`: Rounded Snapchat pill input controls with focus rings.
    - `Badge.tsx`: Reusable status capsules (active, expired, live, pending).
    - `Avatar.tsx`: Snapchat Bitmoji / user avatar badge with Snapchat yellow/purple ring.
  - Every screen, feature, and modal MUST import and reuse these shared primitives instead of writing independent custom styling.

- **Mandatory Shared Modules & Code Reuse**:
  - Before writing ANY new component, utility, hook, or API helper, ALWAYS check existing files.
  - Reuse existing code: never create duplicate or parallel "alag se" functions.
  - Single source of truth:
    - Shared types: `types/index.ts`
    - Shared Supabase clients: `lib/supabase/*`
    - Shared Storage helper: `lib/storage.ts`
    - Shared Geolocation hook: `hooks/useConsentedLocation.ts`
    - Shared Realtime hook: `hooks/useRealtimeLocations.ts`
  - If a component or function needs an enhancement, cleanly extend the existing shared module via props or options.

Suggested structure:
app/
components/
  ui/           # Shared atomic design system primitives (Button, Card, Modal, Input, Badge)
  viewer/       # Public viewer components (reusing ui/*)
  admin/        # Admin operations components (reusing ui/*)
lib/
  supabase/     # Shared Supabase clients (client, server, admin)
  storage.ts    # Shared snap-images bucket operations
  utils.ts      # Shared styling & formatting utilities
hooks/          # Shared hooks (useConsentedLocation, useRealtimeLocations)
types/          # Shared TypeScript domain definitions
supabase/       # Migrations & MASTER_SCHEMA.sql
public/         # Static assets (LOGO.svg, favicon.svg)

Keep server and client responsibilities separate.
Use strict TypeScript.
Prefer reusable focused modules.

## 14. 200-LINE HARD LIMIT
Every source/code/config file should remain <= 200 lines.

When approaching 200 lines:
- split components;
- split hooks;
- split services;
- split utilities;
- keep files single-purpose.

Do not minify code to bypass this rule.

## 15. 360-DEGREE IMPACT CHECK
Before every change ask:
- What routes use this?
- What components use this?
- What API/server code uses this?
- What database tables/policies depend on this?
- What migrations need updating?
- Does MASTER_SCHEMA need updating?
- Does admin UI depend on it?
- Does public UI depend on it?
- Does Realtime depend on it?
- Does deployment/config depend on it?
- Does testing/documentation need updating?

Never fix only the visible symptom.

## 16. AUTOMATED GIT / DEPLOYMENT
When GitHub/Vercel credentials or integrations are configured and the developer has authorized automation:
- inspect git status;
- create logical commits;
- never commit secrets;
- push changes through the available authenticated GitHub API/CLI;
- trigger deployment through the available Vercel API/CLI;
- verify deployment status;
- verify production build/health where possible.

Do NOT require manual GitHub push or manual deployment when automation is available.

If credentials/integration are unavailable, do not fake success. Report the exact missing capability.

Never force-push or destroy history unless explicitly instructed.

## 17. TESTING
After meaningful changes run:
- typecheck
- lint
- tests
- production build

Also test:
- upload
- link generation
- expiry
- deactivation
- permission granted
- permission denied
- unavailable location
- session creation
- location update validation
- RLS
- Realtime
- admin authentication
- responsive layouts

Never claim a test passed unless it actually ran.

## 18. DEVELOPMENT ORDER
Phase 1: repository audit
Phase 2: architecture
Phase 3: Supabase inspection
Phase 4: migrations + MASTER_SCHEMA
Phase 5: auth/RLS
Phase 6: admin dashboard
Phase 7: image storage/upload
Phase 8: share links
Phase 9: public viewer
Phase 10: consented geolocation
Phase 11: secure location API
Phase 12: Realtime
Phase 13: admin map
Phase 14: security audit
Phase 15: mobile audit
Phase 16: build/deploy
Phase 17: final end-to-end verification

## 19. DOCUMENTATION
Maintain:
- README.md
- `.env.example`
- Supabase migration history
- `supabase/MASTER_SCHEMA.sql`

README must explain setup, environment variables by NAME, migrations, local development, tests, and deployment.

Never put actual secret values into documentation.

## 20. DEFINITION OF DONE
Do not declare completion until:
- build passes;
- TypeScript passes;
- lint passes;
- migrations are applied/verified;
- MASTER_SCHEMA is current;
- RLS is verified;
- storage works;
- links work;
- consent flow works;
- location updates work only during active permitted sessions;
- admin Realtime map works;
- no secret is exposed;
- GitHub/deployment automation is verified when credentials exist;
- all code/config files respect the 200-line rule.
