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
