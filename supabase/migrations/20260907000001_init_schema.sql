-- SNAP APP Database Migration: 20260907000001_init_schema.sql
-- Enables UUID extension, creates domain tables, RLS policies & realtime

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. IMAGE_LINKS TABLE
CREATE TABLE IF NOT EXISTS public.image_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  image_path TEXT NOT NULL,
  title TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_location BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. LOCATION_SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.location_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.image_links(id) ON DELETE CASCADE,
  consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'revoked'))
);

-- 4. LOCATION_UPDATES TABLE
CREATE TABLE IF NOT EXISTS public.location_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.location_sessions(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
  accuracy DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ADMIN_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES FOR FAST QUERYING
CREATE INDEX IF NOT EXISTS idx_image_links_slug ON public.image_links(slug);
CREATE INDEX IF NOT EXISTS idx_image_links_active ON public.image_links(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_location_sessions_link_id ON public.location_sessions(link_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_session_id ON public.location_updates(session_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_created_at ON public.location_updates(created_at DESC);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- PUBLIC POLICIES (Safe visitor access)
-- Public can view active, non-expired links
DROP POLICY IF EXISTS "Public can view active links by slug" ON public.image_links;
CREATE POLICY "Public can view active links by slug"
  ON public.image_links FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Public can insert consented session for valid active link
DROP POLICY IF EXISTS "Public can create location session" ON public.location_sessions;
CREATE POLICY "Public can create location session"
  ON public.location_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.image_links
      WHERE id = link_id AND is_active = true AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Public can view their own session
DROP POLICY IF EXISTS "Public can view own session" ON public.location_sessions;
CREATE POLICY "Public can view own session"
  ON public.location_sessions FOR SELECT
  USING (true);

-- Public can insert location update for active session
DROP POLICY IF EXISTS "Public can insert location updates" ON public.location_updates;
CREATE POLICY "Public can insert location updates"
  ON public.location_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.location_sessions
      WHERE id = session_id AND status = 'active'
    )
  );

-- ADMIN POLICIES (Full control via service role / authenticated admin)
DROP POLICY IF EXISTS "Admin full access on profiles" ON public.profiles;
CREATE POLICY "Admin full access on profiles"
  ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access on image_links" ON public.image_links;
CREATE POLICY "Admin full access on image_links"
  ON public.image_links FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access on location_sessions" ON public.location_sessions;
CREATE POLICY "Admin full access on location_sessions"
  ON public.location_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access on location_updates" ON public.location_updates;
CREATE POLICY "Admin full access on location_updates"
  ON public.location_updates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin full access on admin_settings" ON public.admin_settings;
CREATE POLICY "Admin full access on admin_settings"
  ON public.admin_settings FOR ALL USING (true) WITH CHECK (true);

-- REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'location_updates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.location_updates;
  END IF;
END $$;
