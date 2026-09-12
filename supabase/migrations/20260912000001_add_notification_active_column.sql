-- Migration: Add is_notification_active to monitored_devices
ALTER TABLE public.monitored_devices ADD COLUMN IF NOT EXISTS is_notification_active BOOLEAN DEFAULT false;
