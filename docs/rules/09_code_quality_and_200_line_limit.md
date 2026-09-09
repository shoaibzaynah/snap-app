# Rule 09: Code Quality, 200-Line Limit & 360-Degree Impact Check

## 1. 200-Line Hard Limit (Rule 14)
**Every source, component, service, hook, utility, or config file MUST remain <= 200 lines.**

When a file approaches 180–200 lines:
- Split UI into modular subcomponents (e.g. `DeviceLiveStreamPanel.tsx` $\rightarrow$ `LiveStreamControls.tsx`, `LiveAudioVisualizer.tsx`, `LiveStreamPlaceholder.tsx`).
- Extract reusable logic into dedicated custom hooks in `hooks/`.
- Extract utility functions into `lib/utils.ts` or domain helpers.
- Keep each file single-purpose and laser-focused.
- NEVER minify code or cram multiple statements onto one line to bypass this rule.

## 2. 360-Degree Impact Check (Rule 15)
Before and after every change, evaluate the complete architectural impact:
- What routes use this?
- What components use this?
- What API/server code uses this?
- What database tables/policies depend on this?
- What migrations need updating?
- Does `MASTER_SCHEMA.sql` need updating?
- Does admin UI depend on it?
- Does public UI depend on it?
- Does Realtime depend on it?
- Does deployment/config depend on it?
- Does documentation (`docs/rules/*.md`, `COMPANION_GUIDE.md`) need updating?

Never fix only the visible symptom. Address the architectural root cause.
