# Rule 10: Git, Build & Deployment Guide

## 0. Secrets (READ FIRST)
- All tokens are in `.env.local` at project root.
- `GITHUB_TOKEN`, `NEXT_PUBLIC_APP_URL` — read these before any push/API call.
- Never hardcode or commit secrets.

---

## CASE A — Web App Change (Next.js only, no Android Java touched)

> Use this when you changed anything in `app/`, `components/`, `lib/`, `hooks/`, `styles/`, or any `.ts`/`.tsx` file.

### Step 0 — Mandatory Version & Build Number Bump (Rule 24)
Before committing or deploying, ALWAYS bump version & build numbers across all configs:
1. `package.json`: Increment `"version"` (semver e.g. `3.1.0` -> `3.1.1` or `3.2.0`).
2. `lib/companion-config.ts`: Update `APP_VERSION` and increment `APP_BUILD_NUMBER` by 1.
3. Every new build MUST have a uniquely incremented version and build number. Never deploy stale versions.

### Step 1 — Verify before committing
```bash
npm run typecheck    # must exit 0
npm run lint         # must exit 0
```

### Step 2 — Commit & Push
```bash
git add .
git commit -m "feat/fix: <short description>"
git pull --rebase origin main
git push origin main
```

### Step 3 — Vercel deploys automatically
- Push to `main` triggers Vercel auto-deploy in ~1-2 min.
- Live URL: read `NEXT_PUBLIC_APP_URL` from `.env.local`
- No APK rebuild needed.

---

## CASE B — Android Companion Change (any `.java` file in `companion-android/`)

> Use this when you changed any Java file in the Android companion app.

### Step 1 — Bump Version (MANDATORY)
In `companion-android/app/build.gradle`:
```groovy
versionCode 22          // increment by 1
versionName "2.8.0"     // increment patch or minor
```
Also update `lib/companion-config.ts`:
```ts
export const COMPANION_APP_VERSION = "2.8.0";
export const COMPANION_APP_VERSION_CODE = 22;
```

### Step 2 — Build APK locally using Java 17
```bash
export JAVA_HOME="/Users/shoaib/.jdk17/Contents/Home"
cd "/Users/shoaib/Desktop/SNAP APP/companion-android"
./gradlew assembleRelease
```
> Gradle 8.11.1 + Java 17 at `/Users/shoaib/.jdk17/Contents/Home` — this combo works.
> Android Studio JBR is Java 25 — do NOT use it with Gradle < 9.

### Step 3 — Copy APK to public/downloads
```bash
cp companion-android/app/build/outputs/apk/release/app-release.apk \
   public/downloads/snap-safety-companion.apk

cp companion-android/app/build/outputs/apk/release/app-release.apk \
   "public/downloads/snap-safety-companion-v2.8.0.apk"
```

### Step 4 — Commit & Push
```bash
npm run typecheck   # must exit 0
git add .
git commit -m "feat: release companion APK v2.8.0 — <what changed>"
git pull --rebase origin main
git push origin main
```

### Step 5 — Verify GitHub Actions (MANDATORY before telling user to reinstall)
```bash
source .env.local
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/repos/shoaibzaynah/snap-app/actions/runs?per_page=3" \
  | grep -E '"conclusion"|"name"'
```
- Wait for `"conclusion": "success"` on the latest run.
- NEVER tell user to install APK until this confirms success.

### Step 6 — Share download link
APK download URL (always read from `.env.local`):
```
{NEXT_PUBLIC_APP_URL}/api/downloads/companion
```
Direct filename: `snap-safety-companion-v<VERSION>.apk`

---

## CASE C — Both Web + Android Changed Together
Run CASE B — it covers everything since you push all files together.

---

## Rebase Conflict on Binary APK (common edge case)
If `git pull --rebase` fails with "Cannot merge binary files" on the APK:
```bash
cp companion-android/app/build/outputs/apk/release/app-release.apk \
   public/downloads/snap-safety-companion.apk
git add public/downloads/snap-safety-companion.apk
GIT_EDITOR=cat git rebase --continue
git push origin main
```

---

## Definition of Done (Rule 20 & Rule 24)
- [ ] Version and build number bumped across configs (Rule 24):
  - Web: `package.json` `"version"` and `lib/companion-config.ts` `APP_VERSION` & `APP_BUILD_NUMBER`
  - Android: `companion-android/app/build.gradle` `versionCode` + `versionName` and `lib/companion-config.ts` `COMPANION_APP_VERSION` & `COMPANION_APP_VERSION_CODE`
- [ ] `npm run typecheck` exit 0
- [ ] `npm run lint` exit 0
- [ ] All files <= 200 lines (Rule 14)
- [ ] If Android: APK built with Java 17, copied to public/downloads/
- [ ] git pull --rebase done, git push exit 0
- [ ] If Android: GitHub Actions conclusion success confirmed via API
- [ ] APK download link shared using NEXT_PUBLIC_APP_URL from .env.local
