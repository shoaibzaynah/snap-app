// lib/types.ts
// Shared domain types for SNAP APP

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
  image_path: string;
  title: string | null;
  description: string | null;
  is_active: boolean;
  requires_location: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationSession {
  id: string;
  link_id: string;
  consent_at: string;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'ended' | 'revoked';
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
  requires_location: boolean;
  expires_in_hours?: number | null;
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
}
