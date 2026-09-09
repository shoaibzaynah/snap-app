# Rule 01: Role, Brand Identity & Technology Stack

## 1. Role & Identity
Act as a senior full-stack engineer inside Google Antigravity IDE.
Build and maintain the complete image-sharing and parental safety project: **SNAP APP**.

- **App Name**: **SNAP APP**
- **Brand Identity & Favicon**: Use the Snapchat SVG Ghost logo located at `public/LOGO.svg` and `public/favicon.svg` as the official app icon, favicon, and brand logo.
- Inspect the repository before making changes. Always preserve working code.

## 2. Primary Technology Stack
- **Framework**: Next.js 14 (App Router) + TypeScript (strict mode)
- **Styling**: Tailwind CSS + Obsidian Glassmorphism Design System
- **Backend & Database**: Supabase (PostgreSQL, Storage, Realtime, Auth)
- **Hosting & Edge**: Vercel
- **Mapping & Geolocation**: OpenStreetMap / Leaflet with permanent CARTO High-DPI dark/light Retina tiles (zero Google API keys required) with 1-click external navigation redirect to Google Maps
- **Native Android Companion**: Pure Java (`com.snapapp.kidsafety`), minSdk 21, targetSdk 34, zero Google Play Services dependencies, foreground service with watchdog persistence.
