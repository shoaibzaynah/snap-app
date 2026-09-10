# Rule 16: Mobile Native UI Standards & Universal Component Reuse

## 1. Universal Component Reuse (Anti-Vibe-Coding)
Every button, card, input, modal, badge, and tab across the entire project (admin dashboard, device hub, public viewer) MUST use identical shared design primitives:
- **Shared Buttons**: All interactive triggers must share identical tactile feedback (`active:scale-95`), consistent pill padding, and standard color tokens (`#FFFC00` Snapchat yellow primary, obsidian glass secondary, red-500 danger).
- **Shared Glass Cards**: Dark surfaces with consistent `border-white/10`, `rounded-2xl` or `rounded-3xl`, and obsidian backdrop blur.
- **Shared Tabs & Badges**: Consistent rounded capsules with status indicator dots and counter badges. No page may invent ad-hoc button or card shapes.

## 2. Zero Horizontal Page Blowout (`overflow-x-hidden`)
Mobile screens (320px–430px) must NEVER experience accidental horizontal scrolling:
- All horizontal item rows (e.g. app filters, tab bars, media carousels) MUST include `overflow-x-auto no-scrollbar max-w-full`.
- Main containers must enforce `max-w-full overflow-x-hidden`.
- Grid systems must collapse cleanly to single columns on small viewports (`grid-cols-1 sm:grid-cols-2`).

## 3. Zero Overlapping Floating Elements (Maps & Media)
- Map tracker controls, status pills, and coordinate sheets must be structurally isolated:
  - **Top Bar**: Compact live/offline pill on the left, action buttons on the right.
  - **Bottom Card**: Coordinates, accuracy, distance, and external navigation anchored to the bottom.
  - Elements must NEVER share the same vertical space on mobile displays.

## 4. Mobile Touch Ergonomics
- Minimum touch target height: `40px` to `44px` for primary actions (Walkie-Talkie, Camera capture, Audio).
- Primary interaction buttons (e.g., Hold-to-Talk) must occupy prominent thumb-friendly widths rather than squishing in a single horizontal row.

## 5. Dynamic Video Framing (TikTok 9:16 vs YouTube 16:9)
- Video streams must natively support switching between **9:16 Portrait (TikTok/Phone)** and **16:9 Widescreen (YouTube)**.
- Video elements must strictly use `object-contain` so camera sensor pixels are never cropped or cut off.

## 6. Anti-AI Aesthetic: Zero Raw Emojis Rule
- Never use raw OS emojis (`🔄`, `📸`, `⚡`, `🗑️`, `🎙️`, `📱`, `🖥️`, etc.) in buttons, headers, action pills, toasts, or cards.
- Always use professional, vector-sharp Lucide SVG icons (`RefreshCw`, `Camera`, `Zap`, `Trash2`, `Mic`, `Smartphone`, `Monitor`) with subtle brand tinting (`text-[#FFFC00]` or `text-white/60`).
- UI must feel like a production Silicon Valley native mobile app (Snapchat / Linear / Vercel), never vibe-coded AI.

