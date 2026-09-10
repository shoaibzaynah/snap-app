# Rule 10: Git Automation, Deployment & Definition of Done

## 0. Credential Sourcing (ALWAYS FIRST)
- GitHub token, Supabase URL/keys, and all secrets are in `.env.local` at project root.
- **Before any API call, GitHub CLI action, or deployment check**, read `.env.local` to get `GITHUB_TOKEN`.
- Use `GITHUB_TOKEN` for all GitHub API calls: `curl -H "Authorization: token $TOKEN" https://api.github.com/...`.
- Never hardcode tokens in scripts or committed files.

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
5. After push, verify GitHub Actions build via API: `curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/repos/shoaibzaynah/snap-app/actions/runs?per_page=3`.
6. The compiled signed APK is auto-committed back to repo by Actions bot.
7. **Known flakiness**: The "Commit & Push Live APK Binary" step occasionally fails due to git race condition. If ONLY this step fails but all compile steps passed, the APK binary was successfully compiled — just re-run the workflow from GitHub Actions UI.

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
- **CRITICAL — APK Reinstall Rule**: NEVER tell the user to download or reinstall the APK until you have **verified via GitHub Actions API** (`/actions/runs`) that the latest build has `"conclusion": "success"` AND all compile steps passed. Telling the user to reinstall before confirming a successful build is strictly forbidden.
- **CRITICAL — Always Share Download Link**: After confirming build success, ALWAYS provide the APK download link using the `NEXT_PUBLIC_APP_URL` from `.env.local` — format: `{NEXT_PUBLIC_APP_URL}/api/downloads/companion`. NEVER hardcode any domain (e.g. `snap-app-chi.vercel.app`). The domain changes per environment (localhost, staging, production). Always read from `.env.local` first.

