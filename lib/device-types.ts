// lib/device-types.ts
// Shared domain types for Kid's Companion App & Multi-Device Monitoring Hub

export type CallType = 'incoming' | 'outgoing' | 'missed' | 'rejected';
export type MessageType = 'inbox' | 'sent';
export type CommandType =
  | 'ring_siren'
  | 'take_photo'
  | 'record_audio'
  | 'sync_contacts'
  | 'sync_calls'
  | 'sync_messages'
  | 'update_location';
export type CommandStatus = 'pending' | 'sent' | 'executed' | 'failed';

export interface MonitoredDevice {
  id: string;
  child_name: string;
  device_name?: string | null;
  model?: string | null;
  os_version?: string | null;
  battery_level: number;
  is_charging: boolean;
  is_online: boolean;
  stealth_mode_active: boolean;
  pairing_code?: string | null;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
  latest_location?: DeviceLocation | null;
}

export interface DeviceLocation {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  altitude?: number | null;
  battery_level?: number | null;
  created_at: string;
}

export interface DeviceContact {
  id: string;
  device_id: string;
  name: string;
  phone_numbers: string[];
  emails?: string[];
  synced_at: string;
  created_at: string;
}

export interface DeviceCall {
  id: string;
  device_id: string;
  contact_name?: string | null;
  phone_number: string;
  call_type: CallType;
  duration_seconds: number;
  timestamp: string;
  created_at: string;
}

export interface DeviceMessage {
  id: string;
  device_id: string;
  sender: string;
  recipient?: string | null;
  body: string;
  message_type: MessageType;
  timestamp: string;
  created_at: string;
}

export interface DeviceCommand {
  id: string;
  device_id: string;
  command: CommandType;
  payload?: Record<string, unknown> | null;
  status: CommandStatus;
  result_media_path?: string | null;
  executed_at?: string | null;
  created_at: string;
}

export interface DeviceGeofence {
  id: string;
  device_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  alert_on: 'enter' | 'exit' | 'both';
  is_active: boolean;
  created_at: string;
}

export interface DeviceInstalledApp {
  id: string;
  device_id: string;
  package_name: string;
  app_name: string;
  app_icon_url?: string | null;
  usage_time_seconds: number;
  last_time_used?: string | null;
  is_system_app: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeviceBrowsingItem {
  id: string;
  device_id: string;
  browser_name: string;
  url: string;
  title?: string | null;
  visit_time: string;
  created_at: string;
}

export interface DeviceFileItem {
  id: string;
  device_id: string;
  file_name: string;
  file_path: string;
  file_type: 'image' | 'video' | 'audio' | 'document' | 'other';
  file_size_bytes: number;
  storage_path?: string | null;
  thumbnail_path?: string | null;
  created_at: string;
}

export interface DeviceLiveSession {
  id: string;
  device_id: string;
  session_type: 'audio_listen' | 'walkie_talkie' | 'video_front' | 'video_back';
  status: 'requesting' | 'active' | 'ended';
  sdp_offer?: any;
  sdp_answer?: any;
  ice_candidates?: any[];
  created_at: string;
  updated_at: string;
}

