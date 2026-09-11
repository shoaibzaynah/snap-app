// components/admin/LinkDetailMap.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { DeviceInfo } from "@/lib/types";
import {
  getDarkTileLayerConfig, createSnapGhostIcon, createSnapAccuracyCircle,
  createAdminLocationIcon, createAdminAccuracyCircle, calculateDistanceMeters,
  formatDistance, fetchAdminCoordinates,
} from "@/lib/map-utils";
import { Compass, Navigation, ExternalLink, MapPin } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export interface LinkVisitorPin {
  sessionId?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  ipAddress?: string;
  deviceInfo?: DeviceInfo | null;
  status?: string;
  timestamp?: string;
}

interface LinkDetailMapProps {
  coordinates: LinkVisitorPin[];
}

export const LinkDetailMap: React.FC<LinkDetailMapProps> = ({ coordinates }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null), mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null), tileLayerRef = useRef<any>(null);
  const [adminLoc, setAdminLoc] = useState<{ lat: number; lng: number; acc?: number } | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const { theme } = useTheme();

  const valid = coordinates.filter((c) => Math.abs(c.latitude) > 0.001 && Math.abs(c.longitude) > 0.001);
  const selectedPin = valid[selectedIdx] || valid[0] || null;

  useEffect(() => { fetchAdminCoordinates((coords) => setAdminLoc(coords)); }, []);

  const renderMarkers = (L: any, map: any, layerGroup: any, items: LinkVisitorPin[], aLoc: typeof adminLoc, activeIdx: number) => {
    layerGroup.clearLayers();
    if (items.length === 0 && !aLoc) return;

    const bounds: [number, number][] = [];
    const active = items[activeIdx] || items[0] || null;

    if (aLoc) {
      bounds.push([aLoc.lat, aLoc.lng]);
      const aMarker = L.marker([aLoc.lat, aLoc.lng], { icon: createAdminLocationIcon(L, 28) }).addTo(layerGroup);
      if (aLoc.acc) createAdminAccuracyCircle(L, [aLoc.lat, aLoc.lng], aLoc.acc).addTo(layerGroup);
      const dToVisitor = active ? formatDistance(calculateDistanceMeters(aLoc.lat, aLoc.lng, active.latitude, active.longitude), active.accuracy, aLoc.acc) : null;
      aMarker.bindPopup(`<div style="color:#000;font-size:12px;padding:4px;"><b>📍 Your Location (Admin)</b><br/><span style="color:#555;">GPS Acc: ±${Math.round(aLoc.acc || 0)}m</span>${dToVisitor ? `<br/><b>Distance: ${dToVisitor}</b>` : ""}</div>`);

      if (active) {
        L.polyline([[aLoc.lat, aLoc.lng], [active.latitude, active.longitude]], { color: "#1a73e8", weight: 2.5, opacity: 0.85, dashArray: "6, 6" }).addTo(layerGroup);
      }
    }

    items.forEach((c, idx) => {
      const pos: [number, number] = [c.latitude, c.longitude];
      bounds.push(pos);
      const marker = L.marker(pos, { icon: createSnapGhostIcon(L, 38) }).addTo(layerGroup);
      if (c.accuracy) createSnapAccuracyCircle(L, pos, c.accuracy).addTo(layerGroup);

      const gmapsUrl = `https://www.google.com/maps?q=${c.latitude},${c.longitude}`;
      const devStr = [c.deviceInfo?.os, c.deviceInfo?.browser, c.deviceInfo?.battery !== undefined ? `${c.deviceInfo.battery}%` : null].filter(Boolean).join(" • ");
      const distFromAdmin = aLoc ? formatDistance(calculateDistanceMeters(aLoc.lat, aLoc.lng, c.latitude, c.longitude), c.accuracy, aLoc.acc) : null;

      marker.on("click", () => { setSelectedIdx(idx); });

      marker.bindPopup(`
        <div style="color:#000;font-family:sans-serif;padding:4px;min-width:180px;">
          <strong style="font-size:13px;display:block;">Visitor #${idx + 1}</strong>
          ${c.ipAddress ? `<span style="font-size:11px;color:#333;display:block;">IP: <b>${c.ipAddress}</b></span>` : ""}
          ${devStr ? `<span style="font-size:11px;color:#555;display:block;">${devStr}</span>` : ""}
          <span style="font-size:11px;color:#555;display:block;">${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)} &bull; Acc: ±${Math.round(c.accuracy || 0)}m</span>
          ${distFromAdmin ? `<div style="margin:4px 0;font-size:11px;color:#1a73e8;font-weight:bold;">📏 Distance to Us: ${distFromAdmin}</div>` : ""}
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;font-size:11px;background:#000;color:#FFFC00;padding:4px 8px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:4px;">Open in Google Maps &rarr;</a>
        </div>
      `);
    });

    if (bounds.length === 1) map.setView(bounds[0], 15);
    else if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      const center: [number, number] = valid.length > 0 ? [valid[0].latitude, valid[0].longitude] : [31.5204, 74.3587];
      const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(center, valid.length > 0 ? 15 : 12);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      const tileConfig = getDarkTileLayerConfig(theme);
      tileLayerRef.current = L.tileLayer(tileConfig.url, tileConfig.options).addTo(map);
      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 250);
      renderMarkers(L, map, layerGroupRef.current, valid, adminLoc, selectedIdx);
    }
    init();
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (tileLayerRef.current) tileLayerRef.current.setUrl(getDarkTileLayerConfig(theme).url); }, [theme]);

  useEffect(() => {
    if (mapInstanceRef.current && layerGroupRef.current) import("leaflet").then((m) => renderMarkers(m.default, mapInstanceRef.current, layerGroupRef.current, valid, adminLoc, selectedIdx));
  }, [valid, adminLoc, selectedIdx]);

  const fitAdminAndPin = (pin: LinkVisitorPin) => {
    if (mapInstanceRef.current && adminLoc) mapInstanceRef.current.fitBounds([[adminLoc.lat, adminLoc.lng], [pin.latitude, pin.longitude]], { padding: [50, 50] });
  };

  const currentDist = adminLoc && selectedPin
    ? formatDistance(calculateDistanceMeters(adminLoc.lat, adminLoc.lng, selectedPin.latitude, selectedPin.longitude), selectedPin.accuracy, adminLoc.acc)
    : null;

  return (
    <div className="relative w-full h-[470px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0B0B0E]">
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#0B0B0E]" />

      {/* Standard Top Overlay Bar */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-[#0B0B0E]/90 backdrop-blur-xl border border-white/10 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#FFFC00] animate-pulse" />
          <span className="text-[10px] font-bold text-white whitespace-nowrap">
            {valid.length} {valid.length === 1 ? "Visitor Pin" : "Visitor Pins"}
          </span>
        </div>
        {selectedPin && valid.length > 1 && (
          <div className="pointer-events-auto py-1 px-2.5 rounded-xl bg-[#0B0B0E]/90 backdrop-blur-xl border border-blue-500/30 shadow-md text-[10px] font-bold text-blue-300">
            Pin #{selectedIdx + 1} Selected
          </div>
        )}
      </div>

      {/* Sleek Compact Bottom Coordinate Card — Identical to Kid Map */}
      {selectedPin ? (
        <div className="absolute bottom-2 left-2 right-2 sm:right-auto sm:max-w-xs z-10 bg-[#0B0B0E]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 sm:p-2.5 shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#FFFC00] truncate">
                {selectedPin.latitude.toFixed(4)}, {selectedPin.longitude.toFixed(4)}
              </span>
              <span className="text-[9px] text-white/40 font-mono shrink-0">
                {selectedPin.accuracy ? `±${Math.round(selectedPin.accuracy)}m` : "GPS"}
              </span>
            </div>
            <a
              href={`https://www.google.com/maps?q=${selectedPin.latitude},${selectedPin.longitude}`}
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
              onClick={() => fitAdminAndPin(selectedPin)}
              title="Click to frame map between you and selected visitor"
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
          <h4 className="text-sm font-bold text-white">No GPS Pins Yet</h4>
          <p className="text-xs text-white/50 mt-1 max-w-xs">When visitors allow location, their coordinates will appear here.</p>
        </div>
      )}
    </div>
  );
};
