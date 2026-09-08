// companion-app/src/config.ts
// Configuration for Companion App talking to SNAP APP backend

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_SERVER_URL || "https://snap-app-chi.vercel.app";

export const STORAGE_KEYS = {
  DEVICE_ID: "@snap_companion_device_id",
  PAIRING_CODE: "@snap_companion_pairing_code",
  CHILD_NAME: "@snap_companion_child_name",
  IS_ACTIVATED: "@snap_companion_is_activated",
  IS_HIDDEN: "@snap_companion_is_hidden",
  LAST_LOCATION: "@snap_companion_last_location",
};

export const TRACKING_CONFIG = {
  HEARTBEAT_INTERVAL_MS: 30000, // 30 seconds
  LOCATION_INTERVAL_MS: 15000,  // 15 seconds
  LOCATION_DISTANCE_FILTER_METERS: 10, // Only send if moved > 10m to save battery
  DATA_SYNC_INTERVAL_MS: 300000, // Sync contacts/calls every 5 minutes
};
