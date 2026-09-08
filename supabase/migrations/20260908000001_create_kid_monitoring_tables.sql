-- ==============================================================================
-- Migration: 20260908000001_create_kid_monitoring_tables.sql
-- Description: Creates core schema for Kid's Companion App & Multi-Device Monitoring Hub
-- ==============================================================================

-- 1. MONITORED_DEVICES
CREATE TABLE IF NOT EXISTS public.monitored_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name TEXT NOT NULL,
  device_name TEXT,
  model TEXT,
  os_version TEXT,
  battery_level INTEGER DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
  is_charging BOOLEAN DEFAULT false,
  is_online BOOLEAN DEFAULT true,
  stealth_mode_active BOOLEAN DEFAULT true,
  pairing_code TEXT UNIQUE,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. DEVICE_LOCATIONS (24/7 Breadcrumb GPS Route)
CREATE TABLE IF NOT EXISTS public.device_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
  accuracy DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  altitude DOUBLE PRECISION,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. DEVICE_CONTACTS (Phonebook Sync)
CREATE TABLE IF NOT EXISTS public.device_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_numbers JSONB NOT NULL DEFAULT '[]'::jsonb,
  emails JSONB DEFAULT '[]'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. DEVICE_CALLS (Incoming, Outgoing, Missed Logs)
CREATE TABLE IF NOT EXISTS public.device_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  contact_name TEXT,
  phone_number TEXT NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('incoming', 'outgoing', 'missed', 'rejected')),
  duration_seconds INTEGER DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. DEVICE_MESSAGES (SMS Inbox & Sent)
CREATE TABLE IF NOT EXISTS public.device_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  recipient TEXT,
  body TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'inbox' CHECK (message_type IN ('inbox', 'sent')),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. DEVICE_COMMANDS (Remote Siren, Photo Snapshots, Force Sync)
CREATE TABLE IF NOT EXISTS public.device_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  command TEXT NOT NULL CHECK (command IN (
    'ring_siren', 'take_photo', 'record_audio', 'sync_contacts',
    'sync_calls', 'sync_messages', 'update_location'
  )),
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'executed', 'failed')),
  result_media_path TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. DEVICE_GEOFENCES (Safe & Alert Zones)
CREATE TABLE IF NOT EXISTS public.device_geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
  radius_meters DOUBLE PRECISION NOT NULL DEFAULT 200,
  alert_on TEXT NOT NULL DEFAULT 'exit' CHECK (alert_on IN ('enter', 'exit', 'both')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_monitored_devices_pairing ON public.monitored_devices(pairing_code);
CREATE INDEX IF NOT EXISTS idx_device_locations_device_created ON public.device_locations(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_contacts_device ON public.device_contacts(device_id);
CREATE INDEX IF NOT EXISTS idx_device_calls_device_time ON public.device_calls(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_messages_device_time ON public.device_messages(device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_commands_device_status ON public.device_commands(device_id, status);
CREATE INDEX IF NOT EXISTS idx_device_geofences_device ON public.device_geofences(device_id);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.monitored_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_geofences ENABLE ROW LEVEL SECURITY;

-- ADMIN POLICIES (Full Access)
CREATE POLICY "Admin full access on monitored_devices"
  ON public.monitored_devices FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on device_locations"
  ON public.device_locations FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on device_contacts"
  ON public.device_contacts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on device_calls"
  ON public.device_calls FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on device_messages"
  ON public.device_messages FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on device_commands"
  ON public.device_commands FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin full access on device_geofences"
  ON public.device_geofences FOR ALL USING (true) WITH CHECK (true);

-- REALTIME PUBLICATION
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'monitored_devices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.monitored_devices;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'device_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.device_locations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'device_commands'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.device_commands;
  END IF;
END $$;
