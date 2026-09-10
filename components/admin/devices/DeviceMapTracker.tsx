// components/admin/devices/DeviceMapTracker.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { DeviceLocation } from "@/lib/device-types";
import {
  getDarkTileLayerConfig,
  createSnapGhostIcon,
  createSnapAccuracyCircle,
} from "@/lib/map-utils";
import { ExternalLink, Navigation, MapPin } from "lucide-react";

import { useTheme } from "@/hooks/useTheme";

interface Props {
  locations: DeviceLocation[];
  childName: string;
  isLiveMovement?: boolean;
  onToggleLiveMovement?: (active: boolean) => void;
}

export const DeviceMapTracker: React.FC<Props> = ({
  locations,
  childName,
  isLiveMovement = false,
  onToggleLiveMovement,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const { theme } = useTheme();

  const validLocations = locations.filter(
    (l) => Math.abs(l.latitude) > 0.001 && Math.abs(l.longitude) > 0.001 && (!l.accuracy || l.accuracy <= 100)
  );
  const latest = validLocations[0] || null;

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      const center: [number, number] = latest
        ? [latest.latitude, latest.longitude]
        : [31.5204, 74.3587];

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, latest ? 16 : 12);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const tileConfig = getDarkTileLayerConfig(theme);
      const tileLayer = L.tileLayer(tileConfig.url, tileConfig.options).addTo(map);
      tileLayerRef.current = tileLayer;

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      setTimeout(() => { map.invalidateSize(); }, 250);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dynamically update tile style when theme changes
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const tileConfig = getDarkTileLayerConfig(theme);
    tileLayerRef.current.setUrl(tileConfig.url);
  }, [theme]);

  useEffect(() => {
    async function updateMarkers() {
      if (!mapInstanceRef.current || !layerGroupRef.current) return;
      const L = (await import("leaflet")).default;
      layerGroupRef.current.clearLayers();

      if (!validLocations || validLocations.length === 0) return;

      const sorted = [...validLocations].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const realTrail: [number, number][] = [];
      for (const p of sorted) {
        if (realTrail.length === 0) realTrail.push([p.latitude, p.longitude]);
        else {
          const prev = realTrail[realTrail.length - 1];
          const dLat = (p.latitude - prev[0]) * 111000, dLng = (p.longitude - prev[1]) * 111000 * Math.cos((p.latitude * Math.PI) / 180);
          const distM = Math.sqrt(dLat * dLat + dLng * dLng);
          if (distM >= 15 && distM <= 1200) realTrail.push([p.latitude, p.longitude]);
        }
      }

      if (realTrail.length > 1) {
        L.polyline(realTrail, { color: "#FFFC00", weight: 3.5, opacity: 0.8, dashArray: "6, 8" }).addTo(layerGroupRef.current);
      }

      realTrail.slice(0, -1).slice(-15).forEach(([lat, lng]) => {
        L.circleMarker([lat, lng], { radius: 3.5, color: "#000", fillColor: "#FFFC00", fillOpacity: 0.75, weight: 1.5 }).addTo(layerGroupRef.current);
      });

      const current = validLocations[0];
      if (current.accuracy) {
        createSnapAccuracyCircle(L, [current.latitude, current.longitude], current.accuracy).addTo(layerGroupRef.current);
      }

      const ghostIcon = createSnapGhostIcon(L, 38);
      const marker = L.marker([current.latitude, current.longitude], { icon: ghostIcon }).addTo(layerGroupRef.current);

      marker.bindPopup(`
        <div style="color: #000; font-family: sans-serif; padding: 4px;">
          <strong style="font-size: 14px; display: block;">${childName}'s Live Location</strong>
          <span style="font-size: 11px; color: #555; display: block;">${new Date(current.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} &bull; Acc: ${Math.round(current.accuracy || 0)}m</span>
          <span style="font-size: 11px; color: #777;">Lat: ${current.latitude.toFixed(5)}, Lng: ${current.longitude.toFixed(5)}</span>
          <div style="margin-top: 6px;">
            <a href="https://www.google.com/maps?q=${current.latitude},${current.longitude}" target="_blank" style="display: inline-block; font-size: 11px; background: #000; color: #FFFC00; padding: 4px 8px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              Open in Google Maps &rarr;
            </a>
          </div>
        </div>
      `);

      mapInstanceRef.current.panTo([current.latitude, current.longitude]);
      mapInstanceRef.current.invalidateSize();
    }

    updateMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, childName]);

  return (
    <div className="relative w-full h-[450px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#0B0B0E]" />

      {onToggleLiveMovement && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => onToggleLiveMovement(!isLiveMovement)}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all shadow-lg flex items-center gap-1.5 ${
              isLiveMovement
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-black/80 hover:bg-black border-white/10 text-white/70"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isLiveMovement ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
            {isLiveMovement ? "Live Movement: ON (3s)" : "Enable Live Movement"}
          </button>
        </div>
      )}

      {latest ? (
        <div className="absolute top-4 left-4 z-10 bg-[#0B0B0E]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-xl max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full ${isLiveMovement ? "bg-emerald-400 animate-pulse" : "bg-white/40"}`} />
            <span className="text-xs font-bold text-white">
              {isLiveMovement ? "Live Real-Time Coordinates" : "Last Known Location"}
            </span>
          </div>
          <p className="text-[11px] font-mono text-[#FFFC00]">
            {latest.latitude.toFixed(6)}, {latest.longitude.toFixed(6)}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-white/50">
            <span>Accuracy: {latest.accuracy ? `${Math.round(latest.accuracy)}m` : "GPS High"}</span>
            {latest.speed && <span>Speed: {Math.round(latest.speed * 3.6)} km/h</span>}
          </div>
          <a
            href={`https://www.google.com/maps?q=${latest.latitude},${latest.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-all"
          >
            <Navigation className="w-3 h-3 text-[#FFFC00]" />
            1-Click Google Maps
            <ExternalLink className="w-3 h-3 text-white/40" />
          </a>
        </div>
      ) : (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0B0B0E]/80 backdrop-blur-sm text-center p-6">
          <MapPin className="w-10 h-10 text-white/30 mb-2" />
          <h4 className="text-sm font-bold text-white">No GPS Points Yet</h4>
          <p className="text-xs text-white/50 mt-1 max-w-xs">
            Coordinates will appear here as soon as the companion app reports location.
          </p>
        </div>
      )}
    </div>
  );
};
