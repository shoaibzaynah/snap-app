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
