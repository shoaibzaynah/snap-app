# AGENTS.md — SNAP APP MASTER ENGINEERING RULES

> **MANDATORY DIRECTIVE FOR ALL AGENTS & SESSIONS**:
> 1. **MANDATORY PRE-READING**: Before starting ANY task, feature, bug fix, or investigation, you MUST locate and carefully read the governing rule file(s) in `docs/rules/` using `view_file`. Never write code blindly without checking the relevant rule file.
> 2. **RULE ADDITION & EXTENSION PROTOCOL**: When instructed to *"add a rule in md"* or update engineering rules, **DO NOT bloat `AGENTS.md` directly**. Instead:
>    - Locate the corresponding topic file in `docs/rules/` and add the rule there.
>    - If no relevant rule file exists for that subject, create a new atomic markdown file in `docs/rules/` (e.g. `docs/rules/14_new_feature_topic.md`), keep it `<= 200 lines`, and register it below in this table.
>    - `AGENTS.md` must ALWAYS remain short, atomic, and concise (`<= 200 lines` per Rule 14).
> 3. **MASTER_SCHEMA.sql MANDATORY UPDATE**: After ANY database change (new table, new column, new constraint, new index, Realtime publication change, RLS policy change), you MUST:
>    - Update `supabase/MASTER_SCHEMA.sql` to reflect the COMPLETE current live database state.
>    - Verify the update matches live DB via Supabase Management API (`/database/query`).
>    - NEVER delete anything from MASTER_SCHEMA — it is cumulative and non-destructive.
>    - See [Rule 03](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/03_supabase_and_master_schema.md) for full details.

---

## Core Brand & Technology Baseline
- **App Name**: **SNAP APP**
- **Brand Identity & Favicon**: Snapchat SVG Ghost logo at `public/LOGO.svg` and `public/favicon.svg` across all pages, layouts, and headers.
- **Primary Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase (Postgres, Storage, Realtime, Auth), Vercel, Leaflet CARTO High-DPI maps.
- **Native Android Companion**: Pure Java (`com.snapapp.kidsafety`, system label *"Snap Safety"*), minSdk 21, targetSdk 34, zero Google Play Services dependencies.
- **Authoritative Admin Email**: Configured via `ADMIN_EMAIL` in `.env.local` and Vercel (default: `shoaibzaynah@gmail.com`).
- **Hard Limit**: Every source, component, hook, utility, or config file MUST remain **<= 200 lines** (Rule 14).
- **Rule 24 (Mandatory Version & Build Bump)**: Every single build, release, and deployment MUST bump the semver version and increment the build number across all relevant configs (`package.json`, `lib/companion-config.ts`, Android `build.gradle`). Never deploy stale version or build numbers.

---

## Master Directory of Modular Rule Files (`docs/rules/`)

Read the specific governing file before working on its respective domain:

| Rule File | Topic & Scope |
|---|---|
| [01_role_and_stack.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/01_role_and_stack.md) | Agent identity, brand assets, app naming, and primary tech stack |
| [02_environment_and_credentials.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/02_environment_and_credentials.md) | Token portals, secrets handling, environment variables, and admin email authorization |
| [03_supabase_and_master_schema.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/03_supabase_and_master_schema.md) | 100% programmatic API Supabase automation and canonical `MASTER_SCHEMA.sql` non-destructive rule |
| [04_database_and_storage.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/04_database_and_storage.md) | Domain table requirements, RLS policies, `snap-images` storage bucket, and MIME types |
| [05_share_links_and_geolocation.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/05_share_links_and_geolocation.md) | Public `/view/[slug]` flow, OpenGraph scraping, visitor disclosure, and geolocation capture |
| [06_frontend_snapchat_design_system.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/06_frontend_snapchat_design_system.md) | Native Snapchat UI/UX, shared UI primitives (`Button`, `Card`, `Modal`, `Input`), anti-vibe-coding |
| [07_admin_dashboard_and_maps.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/07_admin_dashboard_and_maps.md) | Admin routes, CARTO High-DPI Leaflet maps, single Snapchat Ghost pin rule, Google Maps redirect |
| [08_kid_companion_parental_suite.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/08_kid_companion_parental_suite.md) | Android companion service, instant WebSocket commands, WebRTC streaming, and 24/7 watchdog persistence |
| [09_code_quality_and_200_line_limit.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/09_code_quality_and_200_line_limit.md) | Rule 14 (200-line hard limit per file) and Rule 15 (360-degree impact check) |
| [10_git_deployment_and_testing.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/10_git_deployment_and_testing.md) | Rule 16 (Git/Vercel automation), Rule 17 (typecheck/lint/build testing), Rule 20 (DoD), and Rule 24 (Mandatory Version & Build Bump) |
| [11_zero_load_architecture.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/11_zero_load_architecture.md) | Rule 21: Zero DB/device load, peer-to-peer WebRTC streaming, ephemeral WebSockets, anti-dummy rule |
| [12_caching_and_fast_refresh.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/12_caching_and_fast_refresh.md) | Rule 22: Client in-memory cache (5-min TTL), instant "Refresh Hub", persistent server tab badges |
| [13_ultra_lightweight_media_encoding.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/13_ultra_lightweight_media_encoding.md) | Rule 23: 2G/EDGE bandwidth architecture (Opus 12-16kbps mono, 240p 10fps H.264 video, 60-byte location payloads) |
| [14_supabase_realtime_architecture.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/14_supabase_realtime_architecture.md) | Supabase Realtime: Broadcast channels (WebRTC signaling, media notifications) vs Postgres Changes (location, commands, device status). Tables ON/OFF list. |
| [15_live_location_architecture.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/15_live_location_architecture.md) | Live location: dual-delivery (Postgres Changes + Broadcast), UPDATE not INSERT for current position, >15m distance threshold for history, 30s persist throttle in live mode, battery tradeoffs |
| [16_mobile_native_ui_standards.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/16_mobile_native_ui_standards.md) | Mobile Native UI standards: zero page blowout, zero overlapping map overlays, universal shared primitives |
| [17_pwa_and_skeleton_architecture.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/17_pwa_and_skeleton_architecture.md) | Universal Skeleton & PWA master architecture: full file registry, dual-theme contrast, zero black screens, and auto-heartbeat recovery |
| [18_live_stream_and_device_telemetry_lifecycle.md](file:///Users/shoaib/Desktop/SNAP%20APP/docs/rules/18_live_stream_and_device_telemetry_lifecycle.md) | Telemetry & Live Stream Lifecycle: Must-fresh GPS on fetch, Tecno/Infinix persistent foreground, selective tab refresh, zero map collision |



