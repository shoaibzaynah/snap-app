# Rule 02: Environment, Credentials & Security Policies

## 1. Credentials & Environment Files
The developer provides required credentials in local `.env.local`.

**Official Token & Credential Retrieval Portals**:
- **Supabase Project URL & Keys** (Anon & Service-Role): `https://supabase.com/dashboard/project/_/settings/api`
- **Supabase Personal Access Token** (CLI & Management API): `https://supabase.com/dashboard/account/tokens`
- **GitHub Personal Access Token (PAT)** (Automated Git commits & pushes): `https://github.com/settings/tokens` (Create classic token with `repo` and `workflow` scopes)
- **Vercel Deployment Token** (Deployment automation): `https://vercel.com/account/tokens`

## 2. Strict Security Mandates
You MUST:
- Inspect `.env.local` locally when necessary;
- Use environment variables, never hardcode secrets in code;
- NEVER print secret values in logs, chat, commits, or generated documentation;
- NEVER commit `.env.local` to git;
- Create/update `.env.example` with variable NAMES and acquisition links only;
- Validate required variables at startup/build time;
- Distinguish browser-safe `NEXT_PUBLIC_*` values from server-only secrets.
- Never expose a Supabase service-role key to the browser. Server-only credentials must stay server-side.

## 3. Admin Email Authorization Rule
- The authoritative admin email is specified by `ADMIN_EMAIL` in `.env.local` and in Vercel project environment variables.
- Default admin account: `shoaibzaynah@gmail.com`.
- Any attempt to access `/admin/*` without an authenticated session matching `ADMIN_EMAIL` must be redirected to `/admin/login`.
- Validate all API input. Never trust client-supplied authorization.
