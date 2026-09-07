-- ==============================================================================
-- 20260907000003_add_granular_permissions_and_telemetry.sql
-- Granular Permission Configuration per link and visitor telemetry collection
-- ==============================================================================

-- 1. Add permissions_config to image_links
ALTER TABLE public.image_links 
  ADD COLUMN IF NOT EXISTS permissions_config JSONB NOT NULL DEFAULT '{"location":true,"device_info":true,"camera":false,"contacts":false}'::jsonb;

-- 2. Add telemetry and capture fields to location_sessions
ALTER TABLE public.location_sessions 
  ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS permissions_granted JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS captured_media_path TEXT,
  ADD COLUMN IF NOT EXISTS captured_data JSONB DEFAULT '{}'::jsonb;
