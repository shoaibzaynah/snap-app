-- ==============================================================================
-- 20260907000002_add_target_url_and_og_preview.sql
-- Add Target URL Redirection & OpenGraph Social Preview metadata fields
-- ==============================================================================

-- Make image_path nullable so pure URL redirects do not require an uploaded image
ALTER TABLE public.image_links 
  ALTER COLUMN image_path DROP NOT NULL;

-- Add target_url, link_type, and OpenGraph metadata columns
ALTER TABLE public.image_links 
  ADD COLUMN IF NOT EXISTS target_url TEXT,
  ADD COLUMN IF NOT EXISTS link_type TEXT NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS og_title TEXT,
  ADD COLUMN IF NOT EXISTS og_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT,
  ADD COLUMN IF NOT EXISTS og_platform TEXT DEFAULT 'snapchat';

-- Index for querying by link_type
CREATE INDEX IF NOT EXISTS idx_image_links_type ON public.image_links(link_type);
