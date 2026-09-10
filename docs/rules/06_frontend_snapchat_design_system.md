# Rule 06: Native Snapchat Frontend Design System & Code Reuse

## 1. Visual Identity & Aesthetic Standards
The entire application (public viewer `/view/[slug]`, admin dashboard, device hub, modals, tables) must breathe the exact same native Snapchat aesthetic:
- **Brand Colors**: Snapchat Yellow (`#FFFC00`) for primary CTAs, active rings, and highlights.
- **Obsidian Dark Surface**: Deep obsidian `#000000` / `#0B0B0E` background with glassmorphic cards (`rgba(255, 255, 255, 0.05)` to `rgba(255, 255, 255, 0.08)`).
- **Typography**: Inter / SF Pro Display style typography with sharp legibility and high contrast.
- **Mobile First**: `100dvh` viewport handling with `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.

## 2. Anti-Vibe-Coding Rule (Zero Inconsistent UI)
Work like a senior product engineering team:
- **Zero "Vibe-Coded" Inconsistent UI**: Never write ad-hoc, inline-styled, one-off cards, buttons, modals, or inputs across different pages.
- **Mandatory Shared UI Primitives (`components/ui/*`)**:
  - `Button.tsx`: Snapchat yellow primary (`#FFFC00`), obsidian pill, glass button variants.
  - `Card.tsx`: Obsidian dark glass surface with border `rgba(255, 255, 255, 0.08)`.
  - `Modal.tsx`: Native Snapchat-styled backdrop blur and bottom sheet / centered modal.
  - `Input.tsx`: Rounded Snapchat pill input controls with focus rings.
  - `Badge.tsx`: Reusable status capsules (active, expired, live, pending, offline).
- Every screen, feature, and modal MUST import and reuse these shared primitives instead of writing independent custom styling.

## 3. Shared Single Source of Truth
- Shared types: `types/index.ts`
- Shared Supabase clients: `lib/supabase/*`
- Shared storage helper: `lib/storage.ts`
- Shared map utilities: `lib/map-utils.ts`
- Shared Geolocation hook: `hooks/useLocation.ts`
- Shared Realtime hook: `hooks/useRealtimeLocations.ts`

## 4. Anti-AI Cliché Framework (5 Core Principles for Production Restyling)
When generating, structuring, or styling UI components, you must act as a senior product designer and strictly avoid common "AI-generated" visual clichés:

### 1. Meaningful Color (No Purposeless Gradients)
- **Avoid**: Generic purple-to-blue gradients for headers, buttons, or chart fills that offer no functional value.
- **Enforce**: Use a single, flat accent color (`#FFFC00` Snapchat yellow or high-contrast state token). Color must highlight actual meaning, hierarchy, and interaction states, not serve as background decoration.

### 2. Data-Driven Cards (No Decorative Icon Tiles)
- **Avoid**: Multi-colored pastel tiles and decorative icons inside every metric card acting as visual clutter.
- **Enforce**: Make the primary number the hero element. Strip away decorative icon padding so the data speaks for itself.

### 3. Clear Visual Hierarchy (No Padded Spreadsheets)
- **Avoid**: Generating identical, uniformly sized cards for all metrics, which creates a flat layout that reads like a padded spreadsheet where the eye has nowhere to land.
- **Enforce**: Establish a clear visual hierarchy. Size the primary hero metric significantly larger, keeping secondary metrics smaller, supportive, and structured.

### 4. Logical Elevation (No Universal Shadows)
- **Avoid**: Applying heavy drop shadows (`shadow-2xl`) and large border radii (`rounded-2xl` on every button/input) universally to all components, making everything float ambiguously.
- **Enforce**: Use clean, hairline borders (`border border-white/10` or `border-zinc-800`) for standard page structure. Use tighter border radii (`rounded-lg` or `rounded-md`) on smaller components. Reserve drop shadows strictly for elements that physically float above the page layer (open menus, dropdowns, modals, popovers).

### 5. Functional Copy & Typography (No Conversational Fluff)
- **Avoid**: Conversational placeholder text and fluff (e.g. "Welcome back, User 👋").
- **Enforce**: Use specific, context-aware data parameters (e.g. "Aug 1 to Aug 31", "Synced 2m ago", "12 Active Devices").
- **Enforce**: Apply tabular numbers (`tabular-nums font-mono`) so digits align cleanly in columns. Replace generic percentage badges with inline sparklines or clean trend indicators.

