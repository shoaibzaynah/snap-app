# Rule 10: Git Automation, Deployment & Definition of Done

## 1. Automated Git & Deployment (Rule 16)
When GitHub credentials exist and automation is authorized:
- Inspect git status (`git status -s`).
- Create clear, logical commits (`git commit -m "..."`).
- Never commit secrets or `.env.local`.
- Push to GitHub (`git push origin main`), which triggers GitHub Actions APK compilation and Vercel production deployment.
- Verify build status and production deployment health.
- Never force-push or destroy git history.

## 2. Mandatory Verification & Testing (Rule 17)
After any meaningful change, run:
1. `npm run typecheck`: Confirm 0 TypeScript compilation errors.
2. `npm run lint`: Confirm 0 lint errors.
3. `npm run build`: Confirm Next.js production build succeeds for all routes.
4. Line count audit: Confirm all modified/created files are `<= 200 lines`.

**Never claim a test passed unless it was actually executed and returned code 0.**

## 3. Definition of Done (Rule 20)
Do NOT declare a task complete until:
- Build passes cleanly (`npm run build`).
- TypeScript passes (`npm run typecheck`).
- Lint passes (`npm run lint`).
- Migrations are applied and verified in Supabase.
- `MASTER_SCHEMA.sql` is up to date and verified against live schema.
- `docs/COMPANION_GUIDE.md` and `docs/rules/*.md` are synchronized with all changes.
- Android release APK is compiled, signed, and updated.
- All files respect the 200-line limit (Rule 14).
- Git repository is committed and pushed cleanly to remote.
