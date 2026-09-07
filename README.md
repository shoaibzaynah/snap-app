# SNAP APP 👻

Official repository for **SNAP APP** — an image sharing platform featuring an authentic, native Snapchat-styled public link viewer and an authenticated admin operations center with real-time location mapping.

---

## 🌟 Overview & Brand Identity

- **Application Name**: `SNAP APP`
- **Brand Identity & Favicon**: Powered by the official Snapchat SVG Ghost logo located in:
  - `public/LOGO.svg`
  - `public/favicon.svg`
- **Public Experience (`/view/[slug]`)**: Pixel-perfect native Snapchat web snap viewer featuring:
  - Signature Snapchat Yellow (`#FFFC00`) and Obsidian Dark theme (`#000000`)
  - Top header with Snapchat Ghost SVG logo, "SNAP APP" branding, and "Open in Snapchat" action pill
  - Full-screen snap story viewport with segmented progress bars, creator badge, and audio indicator
   - Native Snapchat-styled bottom bar with "Chat" reply pill, lens filter, and share action

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript (Strict), Tailwind CSS
- **Design Tokens**: Snapchat Yellow (`#FFFC00`), Dark Mode, Glassmorphism, 100dvh safe-area support
- **Backend & Database**: Supabase (PostgreSQL with RLS, Supabase Storage, Supabase Realtime, Supabase Auth)
- **Mapping**: OpenStreetMap (Leaflet / Dark theme, zero API keys required) with 1-click external Google Maps redirection
- **Deployment**: Vercel

---

## 🗄️ Database & Storage Provisioning via API

All database structures and storage buckets are configured **100% programmatically via Supabase APIs**:
- **Storage Bucket (`snap-images`)**: Created via Storage API with public read permissions and authenticated admin write/delete policies.
- **Canonical Schema**: Snapshot maintained in `supabase/MASTER_SCHEMA.sql`.
- **Tables**: `profiles`, `image_links`, `location_sessions`, `location_updates`, `admin_settings`.
- **Automated Provisioning**: Run `npm run setup:supabase` to verify and auto-provision tables, RLS policies, realtime publications, and storage buckets without manual dashboard steps.
- **Security**: Row Level Security (RLS) strictly enforced; service-role keys stay strictly server-side.

---

## ⚙️ Environment Configuration & Token Acquisition

Copy the template to create your local `.env.local`:

```bash
cp .env.example .env.local
```

### 🔗 Where to Obtain API Tokens & Credentials:
- **Supabase Project URL & Keys** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`):
  [Supabase Project Settings > API](https://supabase.com/dashboard/project/_/settings/api)
- **Supabase Personal Access Token** (`SUPABASE_ACCESS_TOKEN` for CLI/Management API):
  [Supabase Account Access Tokens](https://supabase.com/dashboard/account/tokens)
- **GitHub Personal Access Token** (`GITHUB_TOKEN` for Git automation):
  [GitHub Token Settings](https://github.com/settings/tokens) *(Create token classic with `repo` & `workflow` scopes)*
- **Vercel Deployment Token** (`VERCEL_TOKEN`):
  [Vercel Account Tokens](https://vercel.com/account/tokens)

> ⚠️ **Security Rule**: Never commit `.env.local` or expose server secrets in client code.

---

## 🎨 Shared Design System & Professional Code Reuse

Strictly eliminates fragmented or "vibe-coded" single-use components:
- **Shared UI Primitives (`components/ui/*`)**: Canonical `Button`, `Card`, `Modal`, `Input`, `Badge`, and `Avatar` components used consistently across public viewer, admin dashboard, modals, and drawers.
- **Unified Native Snapchat Identity**: Every screen shares signature Snapchat Yellow (`#FFFC00`), Obsidian dark surfaces (`#000000`/`#0B0B0E`), glassmorphism, and rounded pill controls.
- **Maximum Modularity**: Centralized types in `types/index.ts`, shared Supabase clients in `lib/supabase/*`, and shared storage operations in `lib/storage.ts`.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type check and lint
npm run typecheck
npm run lint

# Production build
npm run build
```

---

## 📐 Engineering Guidelines

- **200-Line Limit**: Every source and configuration file remains <= 200 lines to enforce modular design.
- **Master Schema Sync**: `supabase/MASTER_SCHEMA.sql` is verified after every migration.
