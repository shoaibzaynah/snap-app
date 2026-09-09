-- supabase/migrations/20260909000001_add_telemetry_unique_constraints.sql
-- Guarantee zero duplication across all device telemetry tables

-- 1. Deduplicate & Unique Index on device_files
DELETE FROM public.device_files a USING public.device_files b
WHERE a.id > b.id AND a.device_id = b.device_id AND a.file_path = b.file_path;
CREATE UNIQUE INDEX IF NOT EXISTS uq_device_files_path ON public.device_files(device_id, file_path);

-- 2. Deduplicate & Unique Index on device_contacts
DELETE FROM public.device_contacts a USING public.device_contacts b
WHERE a.id > b.id AND a.device_id = b.device_id AND a.name = b.name;
CREATE UNIQUE INDEX IF NOT EXISTS uq_device_contacts_name ON public.device_contacts(device_id, name);

-- 3. Deduplicate & Unique Index on device_calls
DELETE FROM public.device_calls a USING public.device_calls b
WHERE a.id > b.id AND a.device_id = b.device_id AND a.phone_number = b.phone_number AND a.timestamp = b.timestamp;
CREATE UNIQUE INDEX IF NOT EXISTS uq_device_calls ON public.device_calls(device_id, phone_number, timestamp);

-- 4. Deduplicate & Unique Index on device_messages
DELETE FROM public.device_messages a USING public.device_messages b
WHERE a.id > b.id AND a.device_id = b.device_id AND a.sender = b.sender AND a.timestamp = b.timestamp;
CREATE UNIQUE INDEX IF NOT EXISTS uq_device_messages ON public.device_messages(device_id, sender, timestamp);
