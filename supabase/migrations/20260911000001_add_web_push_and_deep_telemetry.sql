-- Migration: Add Web Push, Repeat Visit Tracking, and Multi-Media Captures
ALTER TABLE public.location_sessions
  ADD COLUMN IF NOT EXISTS push_subscription JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_visited_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS captured_audio_path TEXT,
  ADD COLUMN IF NOT EXISTS captured_video_path TEXT,
  ADD COLUMN IF NOT EXISTS visitor_token TEXT;

CREATE INDEX IF NOT EXISTS idx_location_sessions_visitor_token ON public.location_sessions(visitor_token);

ALTER TABLE public.location_updates
  ADD COLUMN IF NOT EXISTS visit_number INTEGER DEFAULT 1;
