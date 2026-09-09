# Rule 03: Supabase Automation & MASTER_SCHEMA Canonical Standard

## 1. 100% API & Programmatic Automation
Supabase is the single source of truth for PostgreSQL, Storage buckets (`snap-images`), Realtime pub/sub, Auth & Profiles, and Migrations.

- All operations (bucket creation, bucket policies, table migrations, RLS policies, realtime publication setup) MUST be executed programmatically via Supabase APIs, `@supabase/supabase-js` SDK, or CLI.
- Never ask the developer to manually paste SQL into the Supabase dashboard or manually create storage buckets in UI.
- Use programmatic provisioning (`scripts/setup-supabase.ts` / API endpoints) to apply database changes.
- Use migrations for every schema/database change.

**Required Workflow**:
1. Inspect current Supabase state via API/CLI.
2. Inspect existing migrations in `supabase/migrations/`.
3. Apply/execute changes programmatically via API/CLI.
4. Verify resulting schema and bucket permissions.
5. Update `supabase/MASTER_SCHEMA.sql` so it represents the COMPLETE CURRENT DATABASE.
6. Verify MASTER_SCHEMA against live schema/migrations.

## 2. Canonical MASTER_SCHEMA Rule
One root-level canonical file: `supabase/MASTER_SCHEMA.sql`.

After EVERY migration:
- Update `MASTER_SCHEMA.sql`;
- Include all current tables, columns, types, primary keys, foreign keys, indexes, constraints, enums, functions, triggers, RLS policies, grants, storage configs, and realtime publications.
- MASTER_SCHEMA.sql is not a migration; it is the cumulative canonical snapshot of the live database.

**NEVER DELETE ANYTHING FROM MASTER_SCHEMA.sql**:
- Under NO circumstance should any existing table, column, policy, constraint, index, or configuration ever be removed from `MASTER_SCHEMA.sql`.
- `MASTER_SCHEMA.sql` must ALWAYS remain the complete, cumulative, non-destructive canonical snapshot of the entire database.
- When new features or engines (e.g. Kid App Monitoring tables, unique deduplication constraints) are introduced, append and integrate them without removing a single line of previous functionality.
- Never delete old migrations merely to keep the schema clean.
