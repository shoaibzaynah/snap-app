# Rule 10: Git Automation, Deployment & Definition of Done

## 1. Automated Git & Deployment (Rule 16)
When GitHub credentials exist and automation is authorized:
- Inspect git status (`git status -s`).
- Create clear, logical commits (`git commit -m "..."`).
- **ALWAYS run `git pull --rebase origin main` before `git push`** to avoid non-fast-forward rejection.
- The correct sequence is always: `git add . && git commit -m "..." && git pull --rebase origin main && git push origin main`.
- Never commit secrets or `.env.local`.
- Push to GitHub triggers: **GitHub Actions** (Android APK build) + **Vercel** (Next.js production deploy).
- Never force-push or destroy git history.

## 2. Android APK Versioning (MANDATORY before every push)
Before committing ANY fix to Android Java files:
1. Open `companion-android/app/build.gradle`.
2. Increment `versionCode` by 1.
3. Increment `versionName` by patch (e.g. `2.3.0` → `2.3.1`).
4. Include this bump in the same commit as the fix.
5. After push, verify GitHub Actions build at: `github.com/shoaibzaynah/snap-app/actions`.
6. The compiled signed APK artifact is auto-committed back to the repo by the Actions bot.

## 3. Mandatory Verification & Testing (Rule 17)
After any meaningful change, run:
1. `npm run typecheck`: Confirm 0 TypeScript compilation errors.
2. `npm run lint`: Confirm 0 lint errors.
3. `npm run build`: Confirm Next.js production build succeeds for all routes.
4. Line count audit: Confirm all modified/created files are `<= 200 lines`.

**Never claim a test passed unless it was actually executed and returned code 0.**

## 4. Definition of Done (Rule 20)
Do NOT declare a task complete until:
- Build passes cleanly (`npm run build`), TypeScript passes, Lint passes.
- Migrations applied and verified in Supabase. `MASTER_SCHEMA.sql` up to date.
- `docs/rules/*.md` synchronized with ALL code changes (Camera API decisions, new permissions, new commands, etc.).
- Android `versionCode`/`versionName` bumped, APK compiled by GitHub Actions, and artifact available.
- `git pull --rebase` done and push succeeded with code 0.
- All files respect the 200-line limit (Rule 14).

