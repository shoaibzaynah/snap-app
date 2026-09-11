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

export const LiveMap: React.FC<{ locations: LiveLocationItem[] }> = ({ locations }) => {
  const mapRef = useRef<HTMLDivElement>(null), mapInst = useRef<any>(null);
  const layerRef = useRef<any>(null), tileRef = useRef<any>(null);
  const [adminLoc, setAdminLoc] = useState<{ lat: number; lng: number; acc?: number } | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const { theme } = useTheme();

  const valid = locations.filter((l) => Math.abs(l.latitude) > 0.001 && Math.abs(l.longitude) > 0.001);
  const selectedLoc = valid[selectedIdx] || valid[0] || null;

  useEffect(() => {
    const unwatch = fetchAdminCoordinates((c) => setAdminLoc(c));
    return () => { if (unwatch) unwatch(); };
  }, []);

  const updateMarkers = (L: any, map: any, layer: any, items: LiveLocationItem[], aLoc: typeof adminLoc, activeIdx: number) => {
    layer.clearLayers();
    if (!items.length && !aLoc) return;
    const bounds: [number, number][] = [], active = items[activeIdx] || items[0] || null;

    // 1. Trail between points (filter indoor drift >= 45m)
    if (items.length > 1) {
      const trail: [number, number][] = [];
      for (const p of items) {
        if (!trail.length) trail.push([p.latitude, p.longitude]);
        else if (calculateDistanceMeters(trail[trail.length - 1][0], trail[trail.length - 1][1], p.latitude, p.longitude) >= 35) trail.push([p.latitude, p.longitude]);
      }
      const totalSpan = trail.length > 1 ? calculateDistanceMeters(trail[0][0], trail[0][1], trail[trail.length - 1][0], trail[trail.length - 1][1]) : 0;
      if (trail.length > 1 && totalSpan >= 45) {
        L.polyline(trail, { color: "#FFFC00", weight: 3, opacity: 0.8, dashArray: "6, 8" }).addTo(layer);
        trail.slice(0, -1).forEach(([lat, lng]) => L.circleMarker([lat, lng], { radius: 3.5, color: "#000", fillColor: "#FFFC00", fillOpacity: 0.8, weight: 1.5 }).addTo(layer));
      }
    }

    // 2. Visitor Snapchat Ghost Pins
    items.forEach((loc, idx) => {
      const pos: [number, number] = [loc.latitude, loc.longitude];
      bounds.push(pos);
      const marker = L.marker(pos, { icon: createSnapGhostIcon(L, 38) }).addTo(layer);
      if (loc.accuracy && loc.accuracy > 0) createSnapAccuracyCircle(L, pos, loc.accuracy).addTo(layer);
      const distStr = aLoc ? formatDistance(calculateDistanceMeters(aLoc.lat, aLoc.lng, loc.latitude, loc.longitude), loc.accuracy, aLoc.acc) : null;
      const gmapsUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
      const devStr = [loc.deviceInfo?.os, loc.deviceInfo?.browser, loc.deviceInfo?.battery !== undefined ? `${loc.deviceInfo.battery}%` : null].filter(Boolean).join(" • ");
      marker.on("click", () => setSelectedIdx(idx));
      marker.bindPopup(`<div style="color:#000;font-family:sans-serif;padding:4px;min-width:180px;"><strong style="font-size:13px;display:block;">${loc.linkTitle || `Visitor #${idx + 1}`}</strong>${loc.ipAddress ? `<span style="font-size:11px;color:#333;display:block;">IP: <b>${loc.ipAddress}</b></span>` : ""}${devStr ? `<span style="font-size:11px;color:#555;display:block;">${devStr}</span>` : ""}<span style="font-size:11px;color:#555;display:block;">${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)} &bull; ±${Math.round(loc.accuracy || 0)}m</span>${distStr ? `<div style="margin:4px 0;font-size:11px;color:#1a73e8;font-weight:bold;">📏 Admin to Location: ${distStr}</div>` : ""}<div style="display:flex;gap:6px;margin-top:4px;"><a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;font-size:11px;background:#000;color:#FFFC00;padding:4px 8px;border-radius:6px;text-decoration:none;font-weight:bold;">Google Maps &rarr;</a>${loc.linkId ? `<a href="/admin/links/${loc.linkId}" style="display:inline-block;font-size:11px;background:#eee;color:#000;padding:4px 8px;border-radius:6px;text-decoration:none;font-weight:bold;">Track Link</a>` : ""}</div></div>`);
    });

    // 3. Admin Location (BLUE MARKER) - Priority zIndex 3000, ALWAYS drawn on top
    if (aLoc) {
      bounds.push([aLoc.lat, aLoc.lng]);
      const aMarker = L.marker([aLoc.lat, aLoc.lng], { icon: createAdminLocationIcon(L, 30), zIndexOffset: 3000 }).addTo(layer);
      if (aLoc.acc) createAdminAccuracyCircle(L, [aLoc.lat, aLoc.lng], aLoc.acc).addTo(layer);
      const dM = active ? calculateDistanceMeters(aLoc.lat, aLoc.lng, active.latitude, active.longitude) : 0;
      const dToAct = active ? formatDistance(dM, active.accuracy, aLoc.acc) : null;
      aMarker.bindPopup(`<div style="color:#000;font-size:12px;padding:4px;"><b>📍 Admin Location (You)</b><br/><span style="color:#555;">GPS Acc: ±${Math.round(aLoc.acc || 0)}m</span>${dToAct ? `<br/><b>Admin to ${active.linkTitle || 'Location'}: ${dToAct}</b>` : ""}</div>`);
      const sameLocThresh = Math.min(Math.max(25, ((active?.accuracy || 0) + (aLoc.acc || 0))), 150);
      if (active && dM > sameLocThresh) L.polyline([[aLoc.lat, aLoc.lng], [active.latitude, active.longitude]], { color: "#1a73e8", weight: 2.5, opacity: 0.9, dashArray: "6, 6" }).addTo(layer);
    }

    if (bounds.length === 1) map.setView(bounds[0], 14);
    else if (bounds.length > 1) map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
  };

  useEffect(() => {
    let active = true;
    async function initMap() {
      if (!mapRef.current || mapInst.current) return;
      const L = (await import("leaflet")).default;
      if (!active || !mapRef.current) return;
      const center: [number, number] = valid.length ? [valid[0].latitude, valid[0].longitude] : [31.5204, 74.3587];
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView(center, valid.length ? 14 : 6);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      tileRef.current = L.tileLayer(getDarkTileLayerConfig(theme).url, getDarkTileLayerConfig(theme).options).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapInst.current = map;
      setTimeout(() => map.invalidateSize(), 250);
      updateMarkers(L, map, layerRef.current, valid, adminLoc, selectedIdx);
    }
    initMap();
    return () => { active = false; if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (tileRef.current) tileRef.current.setUrl(getDarkTileLayerConfig(theme).url); }, [theme]);
  useEffect(() => {
    if (mapInst.current && layerRef.current) import("leaflet").then((m) => updateMarkers(m.default, mapInst.current, layerRef.current, valid, adminLoc, selectedIdx));
  }, [valid, adminLoc, selectedIdx]);

  const fitAdminAndPin = (pin: LiveLocationItem) => {
    if (mapInst.current && adminLoc) mapInst.current.fitBounds([[adminLoc.lat, adminLoc.lng], [pin.latitude, pin.longitude]], { padding: [50, 50] });
  };

  const currentDist = adminLoc && selectedLoc
    ? formatDistance(calculateDistanceMeters(adminLoc.lat, adminLoc.lng, selectedLoc.latitude, selectedLoc.longitude), selectedLoc.accuracy, adminLoc.acc)
    : null;

  return (
    <div className="relative w-full h-[470px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0B0B0E]">
      <div ref={mapRef} className="w-full h-full z-0 bg-[#0B0B0E]" />
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-[#0B0B0E]/90 backdrop-blur-xl border border-white/10 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#FFFC00] animate-pulse" />
          <span className="text-[10px] font-bold text-white whitespace-nowrap">{valid.length} {valid.length === 1 ? "Pin" : "Pins"}</span>
        </div>
        {adminLoc && (
          <div className="pointer-events-auto flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-[#0B0B0E]/90 backdrop-blur-xl border border-blue-500/40 shadow-md">
            <span className="w-2 h-2 rounded-full shrink-0 bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
            <span className="text-[10px] font-bold text-blue-300 whitespace-nowrap">Admin (You)</span>
          </div>
        )}
        {selectedLoc && valid.length > 1 && (
          <div className="pointer-events-auto py-1 px-2.5 rounded-xl bg-[#0B0B0E]/90 backdrop-blur-xl border border-white/10 shadow-md text-[10px] font-bold text-[#FFFC00]">
            {selectedLoc.linkTitle || `Pin #${selectedIdx + 1}`}
          </div>
        )}
      </div>

      {selectedLoc ? (
        <div className="absolute bottom-2 left-2 right-2 sm:right-auto sm:max-w-xs z-10 bg-[#0B0B0E]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 sm:p-2.5 shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#FFFC00] truncate">{selectedLoc.latitude.toFixed(4)}, {selectedLoc.longitude.toFixed(4)}</span>
              <span className="text-[9px] text-white/40 font-mono shrink-0">{selectedLoc.accuracy ? `±${Math.round(selectedLoc.accuracy)}m` : "GPS"}</span>
            </div>
            <a href={`https://www.google.com/maps?q=${selectedLoc.latitude},${selectedLoc.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 py-0.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] shrink-0 transition-all active:scale-95" title="Open Google Maps">
              <Navigation className="w-2.5 h-2.5 text-[#FFFC00]" /><span>Maps</span><ExternalLink className="w-2.5 h-2.5 text-white/40" />
            </a>
          </div>
          {currentDist && (
            <button onClick={() => fitAdminAndPin(selectedLoc)} title="Click to frame map between you and selected location" className="w-full flex items-center justify-between gap-1.5 py-1 px-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-300 text-[9px] sm:text-[10px] font-medium leading-none transition-all active:scale-[0.99]">
              <span className="flex items-center gap-1 truncate"><Compass className="w-3 h-3 text-blue-400 shrink-0" /><span className="truncate">Admin ➔ {selectedLoc.linkTitle ? "Pin" : `#${selectedIdx + 1}`}: {currentDist}</span></span>
              <span className="text-[8px] text-blue-400/70 uppercase tracking-wider shrink-0 font-bold">Fit</span>
            </button>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0B0B0E]/80 backdrop-blur-sm text-center p-6">
          <MapPin className="w-10 h-10 text-white/30 mb-2" /><h4 className="text-sm font-bold text-white">No Live Locations Yet</h4><p className="text-xs text-white/50 mt-1 max-w-xs">Incoming visitor coordinates will automatically plot on this map.</p>
        </div>
      )}
    </div>
  );
};
