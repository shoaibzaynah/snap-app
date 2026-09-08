-- supabase/migrations/20260908000002_create_advanced_companion_tables.sql
-- Engine 2: Advanced Monitoring Tables (Apps & Screen Time, Browsing, Files, WebRTC Live Stream)

-- 1. Installed Apps & Screen Time
CREATE TABLE IF NOT EXISTS device_installed_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES monitored_devices(id) ON DELETE CASCADE,
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

-- 2. Browsing History & Visited URLs
CREATE TABLE IF NOT EXISTS device_browsing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES monitored_devices(id) ON DELETE CASCADE,
  browser_name TEXT DEFAULT 'Chrome',
  url TEXT NOT NULL,
  title TEXT,
  visit_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. On-Demand Gallery & Files Explorer
CREATE TABLE IF NOT EXISTS device_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES monitored_devices(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image' CHECK (file_type IN ('image', 'video', 'audio', 'document', 'other')),
  file_size_bytes BIGINT DEFAULT 0,
  storage_path TEXT,
  thumbnail_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Live Stream & Walkie-Talkie WebRTC Sessions
CREATE TABLE IF NOT EXISTS device_live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES monitored_devices(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('audio_listen', 'walkie_talkie', 'video_front', 'video_back')),
  status TEXT NOT NULL DEFAULT 'requesting' CHECK (status IN ('requesting', 'active', 'ended')),
  sdp_offer JSONB,
  sdp_answer JSONB,
  ice_candidates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_installed_apps_device ON device_installed_apps(device_id);
CREATE INDEX IF NOT EXISTS idx_installed_apps_usage ON device_installed_apps(device_id, usage_time_seconds DESC);
CREATE INDEX IF NOT EXISTS idx_browsing_history_device ON device_browsing_history(device_id, visit_time DESC);
CREATE INDEX IF NOT EXISTS idx_device_files_device ON device_files(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_sessions_device ON device_live_sessions(device_id, status);

-- Enable RLS
ALTER TABLE device_installed_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_browsing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_live_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin full access on device_installed_apps" ON device_installed_apps FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on device_browsing_history" ON device_browsing_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on device_files" ON device_files FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access on device_live_sessions" ON device_live_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on device_installed_apps" ON device_installed_apps FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on device_browsing_history" ON device_browsing_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on device_files" ON device_files FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on device_live_sessions" ON device_live_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
