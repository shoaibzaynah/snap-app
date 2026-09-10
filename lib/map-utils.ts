// lib/map-utils.ts
// Shared Canonical Map Utilities for SNAP APP (Leaflet Dark Tiles & Ghost Locator Marker)

export interface TileLayerConfig {
  url: string;
  options: {
    maxZoom: number;
    subdomains?: string;
    detectRetina?: boolean;
    className?: string;
    attribution: string;
  };
}

// Permanent Canonical CARTO API Key for Ultra-Sharp 512px Retina Tiles
export const PERMANENT_CARTO_API_KEY = "cb1_30vw_1_58aea214346da718249bc931";

/**
 * Returns ultra-sharp, high-DPI tile configuration without blur or watermarks.
 * Automatically serves dark_all in Dark mode and light_all in Light mode.
 * Leaflet automatically replaces {r} with '@2x' on Retina displays for 512px sharpness.
 */
export function getDarkTileLayerConfig(theme: "dark" | "light" = "dark"): TileLayerConfig {
  const activeKey = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim() || PERMANENT_CARTO_API_KEY;
  const tileMode = theme === "light" ? "light_all" : "dark_all";

  return {
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/${tileMode}/{z}/{x}/{y}{r}.png?key=${activeKey}`,
    options: {
      maxZoom: 20,
      subdomains: "abcd",
      detectRetina: true,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  };
}

/**
 * Canonical glowing Snapchat Ghost locator marker pin used across all maps.
 */
export function createSnapGhostIcon(L: any, size = 38) {
  const innerSize = Math.round(size * 0.74);
  const emojiSize = Math.round(innerSize * 0.55);

  return L.divIcon({
    className: "snap-marker-pin",
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,252,0,0.65) 0%, rgba(255,252,0,0) 70%);
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        "></div>
        <div style="
          position: relative;
          width: ${innerSize}px;
          height: ${innerSize}px;
          border-radius: 50%;
          background-color: #FFFC00;
          border: 2.5px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 18px rgba(255,252,0,0.95);
        ">
          <span style="font-size: ${emojiSize}px; line-height: 1; user-select: none;">👻</span>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Creates canonical Snapchat Yellow accuracy circle.
 */
export function createSnapAccuracyCircle(L: any, latLng: [number, number], accuracyMeters: number) {
  return L.circle(latLng, {
    radius: accuracyMeters,
    color: "#FFFC00",
    fillColor: "#FFFC00",
    fillOpacity: 0.14,
    weight: 1.5,
  });
}

/**
 * Google Maps style pulsing Blue Dot for Admin device location.
 */
export function createAdminLocationIcon(L: any, size = 28) {
  const dotSize = Math.round(size * 0.55);
  return L.divIcon({
    className: "admin-marker-pin",
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: ${size}px; height: ${size}px; border-radius: 50%; background: radial-gradient(circle, rgba(66, 133, 244, 0.55) 0%, rgba(66, 133, 244, 0) 70%); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
        <div style="position: relative; width: ${dotSize}px; height: ${dotSize}px; border-radius: 50%; background-color: #1a73e8; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(26, 115, 232, 0.9);"></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function createAdminAccuracyCircle(L: any, latLng: [number, number], accuracyMeters: number) {
  return L.circle(latLng, {
    radius: accuracyMeters,
    color: "#1a73e8",
    fillColor: "#4285f4",
    fillOpacity: 0.12,
    weight: 1.2,
  });
}

/**
 * Haversine formula to calculate distance between two coordinates in meters.
 */
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance with Smart Proximity: shows 'Same Location (< 25 m)' if within GPS jitter.
 */
export function formatDistance(meters: number, accuracyMeters?: number | null, verbose = false): string {
  const threshold = Math.max(25, accuracyMeters ? Math.min(accuracyMeters, 45) : 25);
  if (meters <= threshold) return verbose ? "Same Location (< 25 m)" : "< 25 m";
  if (meters < 1000) return verbose ? `${Math.round(meters)} m (${(meters / 1000).toFixed(2)} km)` : `${Math.round(meters)} m`;
  const km = (meters / 1000).toFixed(1);
  return verbose ? `${km} km (${Math.round(meters).toLocaleString()} m)` : `${km} km`;
}

/**
 * Clean browser geolocation fetcher for admin dashboard device with fresh GPS hardware fix.
 */
export function fetchAdminCoordinates(onSuccess: (coords: { lat: number; lng: number; acc?: number }) => void) {
  if (typeof window === "undefined" || !navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      onSuccess({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        acc: pos.coords.accuracy,
      });
    },
    () => {},
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
  );
}


