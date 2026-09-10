// components/admin/devices/DeviceMapTracker.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { DeviceLocation } from "@/lib/device-types";
import {
  getDarkTileLayerConfig, createSnapGhostIcon, createSnapAccuracyCircle,
  createAdminLocationIcon, createAdminAccuracyCircle, calculateDistanceMeters,
  formatDistance, fetchAdminCoordinates,
} from "@/lib/map-utils";
import { ExternalLink, Navigation, MapPin, Compass } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  locations: DeviceLocation[];
  childName: string;
  isLiveMovement?: boolean;
  onToggleLiveMovement?: (active: boolean) => void;
}

export const DeviceMapTracker: React.FC<Props> = ({
  locations, childName, isLiveMovement = false, onToggleLiveMovement,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const [adminLoc, setAdminLoc] = useState<{ lat: number; lng: number; acc?: number } | null>(null);
  const { theme } = useTheme();

  const valid = locations.filter(
    (l) => Math.abs(l.latitude) > 0.001 && Math.abs(l.longitude) > 0.001 && (!l.accuracy || l.accuracy <= 1500)
  );
  const latest = valid[0] || null;

  useEffect(() => { fetchAdminCoordinates((coords) => setAdminLoc(coords)); }, []);

  useEffect(() => {
    let isMounted = true;
    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      const center: [number, number] = latest ? [latest.latitude, latest.longitude] : [31.5204, 74.3587];
      const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(center, latest ? 16 : 12);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      const tileConfig = getDarkTileLayerConfig(theme);
      tileLayerRef.current = L.tileLayer(tileConfig.url, tileConfig.options).addTo(map);
      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 250);
    }
    initMap();
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tileLayerRef.current) tileLayerRef.current.setUrl(getDarkTileLayerConfig(theme).url);
  }, [theme]);

  useEffect(() => {
    async function updateMarkers() {
      if (!mapInstanceRef.current || !layerGroupRef.current) return;
      const L = (await import("leaflet")).default;
      layerGroupRef.current.clearLayers();
      if (!valid || valid.length === 0) return;

      const current = valid[0];
      const sorted = [...valid].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const trail: [number, number][] = [];
      for (const p of sorted) {
        if (!trail.length) trail.push([p.latitude, p.longitude]);
        else {
          const prev = trail[trail.length - 1];
          const dLat = (p.latitude - prev[0]) * 111000, dLng = (p.longitude - prev[1]) * 111000 * Math.cos((p.latitude * Math.PI) / 180);
          if (Math.hypot(dLat, dLng) >= 15 && Math.hypot(dLat, dLng) <= 1200) trail.push([p.latitude, p.longitude]);
        }
      }
      if (trail.length > 1) L.polyline(trail, { color: "#FFFC00", weight: 3.5, opacity: 0.8, dashArray: "6, 8" }).addTo(layerGroupRef.current);
      trail.slice(0, -1).slice(-15).forEach(([lat, lng]) => {
        L.circleMarker([lat, lng], { radius: 3.5, color: "#000", fillColor: "#FFFC00", fillOpacity: 0.75, weight: 1.5 }).addTo(layerGroupRef.current);
      });

      if (current.accuracy) createSnapAccuracyCircle(L, [current.latitude, current.longitude], current.accuracy).addTo(layerGroupRef.current);
      const childMarker = L.marker([current.latitude, current.longitude], { icon: createSnapGhostIcon(L, 38) }).addTo(layerGroupRef.current);

      let distanceStr = "";
      if (adminLoc) {
        const dMeters = calculateDistanceMeters(adminLoc.lat, adminLoc.lng, current.latitude, current.longitude);
        distanceStr = formatDistance(dMeters, current.accuracy);
        const adminIcon = createAdminLocationIcon(L, 28);
        const aMarker = L.marker([adminLoc.lat, adminLoc.lng], { icon: adminIcon }).addTo(layerGroupRef.current);
        if (adminLoc.acc) createAdminAccuracyCircle(L, [adminLoc.lat, adminLoc.lng], adminLoc.acc).addTo(layerGroupRef.current);
        aMarker.bindPopup(`<div style="color:#000;font-size:12px;padding:4px;"><b>📍 Your Location (Admin)</b><br/><span style="color:#555;">Acc: ±${Math.round(adminLoc.acc || 0)}m</span><br/><b>Distance to ${childName}: ${distanceStr}</b></div>`);
        L.polyline([[adminLoc.lat, adminLoc.lng], [current.latitude, current.longitude]], { color: "#1a73e8", weight: 2.5, opacity: 0.85, dashArray: "6, 6" }).addTo(layerGroupRef.current);
      }

      childMarker.bindPopup(`
        <div style="color: #000; font-family: sans-serif; padding: 4px;">
          <strong style="font-size: 13px; display: block;">${childName}'s Live Location</strong>
          <span style="font-size: 11px; color: #555; display: block;">${new Date(current.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} &bull; Acc: ${Math.round(current.accuracy || 0)}m</span>
          ${distanceStr ? `<div style="margin:4px 0;font-size:11px;color:#1a73e8;font-weight:bold;">📏 ${distanceStr}</div>` : ""}
          <a href="https://www.google.com/maps?q=${current.latitude},${current.longitude}" target="_blank" style="display: inline-block; font-size: 11px; background: #000; color: #FFFC00; padding: 4px 8px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 4px;">Open in Google Maps &rarr;</a>
        </div>
      `);
      mapInstanceRef.current.panTo([current.latitude, current.longitude]);
      mapInstanceRef.current.invalidateSize();
    }
    updateMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, childName, adminLoc]);

  const fitAdminAndChild = () => {
    if (!mapInstanceRef.current || !adminLoc || !latest) return;
    mapInstanceRef.current.fitBounds([[adminLoc.lat, adminLoc.lng], [latest.latitude, latest.longitude]], { padding: [50, 50] });
  };

  const currentDist = adminLoc && latest ? formatDistance(calculateDistanceMeters(adminLoc.lat, adminLoc.lng, latest.latitude, latest.longitude), latest.accuracy) : null;

  return (
    <div className="relative w-full h-[470px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#0B0B0E]" />

      {/* Non-overlapping Top Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 py-1.5 px-3 rounded-2xl bg-[#0B0B0E]/90 backdrop-blur-xl border border-white/10 shadow-lg">
          <span className={`w-2 h-2 rounded-full ${isLiveMovement ? "bg-emerald-400 animate-pulse" : "bg-white/40"}`} />
          <span className="text-[11px] font-bold text-white whitespace-nowrap">
            {isLiveMovement ? "Live (3s)" : latest ? "GPS Active" : "No GPS"}
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 shrink-0">
          {onToggleLiveMovement && (
            <button
              onClick={() => onToggleLiveMovement(!isLiveMovement)}
              className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold border transition-all shadow-lg flex items-center gap-1.5 ${isLiveMovement ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-black/80 hover:bg-black border-white/10 text-white/70"}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveMovement ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
              {isLiveMovement ? "Tracking" : "Track"}
            </button>
          )}
          {adminLoc && latest && (
            <button
              onClick={fitAdminAndChild}
              className="py-1.5 px-2.5 rounded-xl text-[11px] font-bold border bg-blue-600/25 hover:bg-blue-600/35 border-blue-500/40 text-blue-300 transition-all shadow-lg flex items-center gap-1.5"
              title="Fit map between your device and child"
            >
              <Compass className="w-3.5 h-3.5 shrink-0" />
              <span>{currentDist}</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean Bottom Coordinate Card - Never Collides with Top Bar */}
      {latest ? (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs z-10 bg-[#0B0B0E]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-mono text-[#FFFC00] truncate">
              {latest.latitude.toFixed(5)}, {latest.longitude.toFixed(5)}
            </span>
            <span className="text-[10px] text-white/50 shrink-0">
              {latest.accuracy ? `±${Math.round(latest.accuracy)}m` : "GPS High"}
            </span>
          </div>
          {currentDist && (
            <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-300 text-[10px] font-bold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
              <span className="truncate">Distance to Admin: {currentDist}</span>
            </div>
          )}
          <a
            href={`https://www.google.com/maps?q=${latest.latitude},${latest.longitude}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-all"
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
          <p className="text-xs text-white/50 mt-1 max-w-xs">Coordinates will appear here as soon as the companion app reports location.</p>
        </div>
      )}
    </div>
  );
};
