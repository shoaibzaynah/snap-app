-- Migration: Expand device_commands allowed commands to support live movement and webRTC controls
ALTER TABLE public.device_commands 
  DROP CONSTRAINT IF EXISTS device_commands_command_check;

ALTER TABLE public.device_commands 
  ADD CONSTRAINT device_commands_command_check 
  CHECK (command IN (
    'ring_siren',
    'take_photo',
    'record_audio',
    'sync_contacts',
    'sync_calls',
    'sync_messages',
    'sync_apps',
    'update_location',
    'fetch_location',
    'start_live_movement',
    'stop_live_movement',
    'webrtc_stream'
  ));
