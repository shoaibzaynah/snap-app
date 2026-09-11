// lib/device-telemetry-types.ts
// Intelligence suite domain types for child companion telemetry

export interface DeviceNotification {
  id: string;
  device_id: string;
  package_name: string;
  app_name?: string | null;
  title: string;
  text: string;
  post_time: string;
  created_at: string;
}

export interface DeviceKeystroke {
  id: string;
  device_id: string;
  package_name?: string | null;
  app_name?: string | null;
  text: string;
  created_at: string;
}

export interface DeviceClipboardItem {
  id: string;
  device_id: string;
  content: string;
  copied_at: string;
  created_at: string;
}

export interface DeviceLockEvent {
  id: string;
  device_id: string;
  event_type: 'screen_on' | 'screen_off' | 'user_present';
  event_time: string;
  created_at: string;
}

export interface DeviceWifiNetwork {
  id: string;
  device_id: string;
  ssid: string;
  bssid?: string | null;
  signal_level?: number | null;
  is_connected: boolean;
  scanned_at: string;
  created_at: string;
}

export interface DeviceTelemetryConfig {
  notifications?: boolean;
  keylogger?: boolean;
  clipboard?: boolean;
  wifi?: boolean;
  lock_events?: boolean;
  call_recording?: boolean;
  screen_time?: boolean;
}
