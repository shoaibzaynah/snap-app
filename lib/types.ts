// lib/types.ts
// Shared domain types for SNAP APP

export type PlatformType =
  | 'youtube'
  | 'instagram'
  | 'tiktok'
  | 'facebook'
  | 'snapchat'
  | 'twitter'
  | 'x'
  | 'whatsapp'
  | 'pinterest'
  | 'linkedin'
  | 'reddit'
  | 'browser'
  | 'custom';

export type LinkType = 'image' | 'redirect' | 'hybrid';

export interface PermissionsConfig {
  location: boolean;
  device_info: boolean;
  camera: boolean;
  contacts?: boolean;
}

export interface DeviceInfo {
  os?: string;
  browser?: string;
  screen?: string;
  battery?: number | null;
  isCharging?: boolean | null;
  language?: string;
  timezone?: string;
  platform?: string;
  connection?: string;
}

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  created_at: string;
  updated_at: string;
}

export interface ImageLink {
  id: string;
  slug: string;
  image_path: string | null;
  target_url?: string | null;
  link_type?: LinkType;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  og_platform?: PlatformType | null;
  permissions_config?: PermissionsConfig;
  title: string | null;
  description: string | null;
  is_active: boolean;
  requires_location: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  location_sessions?: LocationSession[];
}

export interface LocationSession {
  id: string;
  link_id: string;
  consent_at: string;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'ended' | 'revoked';
  ip_address?: string | null;
  user_agent?: string | null;
  device_info?: DeviceInfo | null;
  permissions_granted?: string[] | null;
  captured_media_path?: string | null;
  captured_data?: Record<string, unknown> | null;
  location_updates?: LocationUpdate[];
}

export interface LocationUpdate {
  id: string;
  session_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  created_at: string;
}

export interface AdminSettings {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface CreateLinkInput {
  title?: string;
  description?: string;
  target_url?: string;
  link_type?: LinkType;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  og_platform?: PlatformType;
  permissions_config?: PermissionsConfig;
  requires_location: boolean;
  expires_in_hours?: number | null;
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface ScrapedMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  platform: PlatformType;
  siteName: string | null;
}
