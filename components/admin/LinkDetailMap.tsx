// components/admin/LinkDetailMap.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { DeviceInfo } from "@/lib/types";
import {
  getMapTileConfig, MapMode, createSnapGhostIcon, createSnapAccuracyCircle,
  createAdminLocationIcon, createAdminAccuracyCircle, calculateDistanceMeters,
  formatDistance, fetchAdminCoordinates,
} from "@/lib/map-utils";
import { Compass, Navigation, ExternalLink, MapPin, Layers, Globe, LocateFixed } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export interface LinkVisitorPin {
  sessionId?: string; latitude: number; longitude: number; accuracy?: number;
  ipAddress?: string; deviceInfo?: DeviceInfo | null; status?: string; timestamp?: string;
}

export const LinkDetailMap: React.FC<{ coordinates: LinkVisitorPin[] }> = ({ coordinates }) => {
  const mapRef = useRef<HTMLDivElement>(null), mapInst = useRef<any>(null), layerRef = useRef<any>(null), tileRef = useRef<any>(null), overlayRef = useRef<any>(null), hasFittedRef = useRef(false);
  const [adminLoc, setAdminLoc] = useState<{ lat: number; lng: number; acc?: number } | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mapMode, setMapMode] = useState<MapMode>("streets");
  const { theme } = useTheme();

  const valid = coordinates.filter((c) => Math.abs(c.latitude) > 0.001 && Math.abs(c.longitude) > 0.001);
  const selectedPin = valid[selectedIdx] || valid[0] || null;

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("snap_map_mode") as MapMode : null;
    if (saved && (saved === "streets" || saved === "satellite")) setMapMode(saved);
    const unwatch = fetchAdminCoordinates((c) => setAdminLoc(c));
    return () => { if (unwatch) unwatch(); };
  }, []);

  const handleModeChange = (m: MapMode) => {
    setMapMode(m);
    if (typeof window !== "undefined") localStorage.setItem("snap_map_mode", m);
  };

  const renderMarkers = (L: any, map: any, layer: any, items: LinkVisitorPin[], aLoc: typeof adminLoc, activeIdx: number) => {
    layer.clearLayers();
    if (!items.length && !aLoc) return;
    const bounds: [number, number][] = [], active = items[activeIdx] || items[0] || null;

    if (items.length > 1) {
      const sorted = [...items].sort((a, b) => (a.timestamp ? new Date(a.timestamp).getTime() : 0) - (b.timestamp ? new Date(b.timestamp).getTime() : 0));
      const trail: [number, number][] = [];
      for (const p of sorted) {
        if (!trail.length || calculateDistanceMeters(trail[trail.length - 1][0], trail[trail.length - 1][1], p.latitude, p.longitude) >= 35) trail.push([p.latitude, p.longitude]);
      }
      if (trail.length > 1 && calculateDistanceMeters(trail[0][0], trail[0][1], trail[trail.length - 1][0], trail[trail.length - 1][1]) >= 45) {
        L.polyline(trail, { color: "#FFFC00", weight: 3, opacity: 0.8, dashArray: "6, 8" }).addTo(layer);
        trail.slice(0, -1).forEach(([lat, lng]) => L.circleMarker([lat, lng], { radius: 3.5, color: "#000", fillColor: "#FFFC00", fillOpacity: 0.8, weight: 1.5 }).addTo(layer));
      }
    }

    items.forEach((c, idx) => {
      const pos: [number, number] = [c.latitude, c.longitude];
      bounds.push(pos);
      const marker = L.marker(pos, { icon: createSnapGhostIcon(L, 38) }).addTo(layer);
      if (c.accuracy) createSnapAccuracyCircle(L, pos, c.accuracy).addTo(layer);
      const gmaps = `https://www.google.com/maps?q=${c.latitude},${c.longitude}`;
      const dev = [c.deviceInfo?.os, c.deviceInfo?.browser, c.deviceInfo?.battery !== undefined ? `${c.deviceInfo.battery}%` : null].filter(Boolean).join(" • ");
      const dAdm = aLoc ? formatDistance(calculateDistanceMeters(aLoc.lat, aLoc.lng, c.latitude, c.longitude), c.accuracy, aLoc.acc) : null;
      marker.on("click", () => setSelectedIdx(idx));
      marker.bindPopup(`<div style="color:#000;font-family:sans-serif;padding:4px;min-width:170px;"><strong style="font-size:13px;display:block;">Visitor #${idx + 1}</strong>${c.ipAddress ? `<span style="font-size:11px;color:#333;display:block;">IP: <b>${c.ipAddress}</b></span>` : ""}${dev ? `<span style="font-size:11px;color:#555;display:block;">${dev}</span>` : ""}<span style="font-size:11px;color:#555;display:block;">${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)} &bull; ±${Math.round(c.accuracy || 0)}m</span>${dAdm ? `<div style="margin:4px 0;font-size:11px;color:#1a73e8;font-weight:bold;">📏 Admin to Visitor: ${dAdm}</div>` : ""}<a href="${gmaps}" target="_blank" rel="noopener noreferrer" style="display:inline-block;font-size:11px;background:#000;color:#FFFC00;padding:4px 8px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:4px;">Open in Google Maps &rarr;</a></div>`);
    });

    if (aLoc) {
      bounds.push([aLoc.lat, aLoc.lng]);
      const aMarker = L.marker([aLoc.lat, aLoc.lng], { icon: createAdminLocationIcon(L, 30), zIndexOffset: 3000 }).addTo(layer);
      if (aLoc.acc) createAdminAccuracyCircle(L, [aLoc.lat, aLoc.lng], aLoc.acc).addTo(layer);
      const dM = active ? calculateDistanceMeters(aLoc.lat, aLoc.lng, active.latitude, active.longitude) : 0;
      const dToAct = active ? formatDistance(dM, active.accuracy, aLoc.acc) : null;
      aMarker.bindPopup(`<div style="color:#000;font-size:12px;padding:4px;"><b>📍 Admin Location (You)</b><br/><span style="color:#555;">GPS Acc: ±${Math.round(aLoc.acc || 0)}m</span>${dToAct ? `<br/><b>Admin to Visitor #${activeIdx + 1}: ${dToAct}</b>` : ""}</div>`);
      const sameLocThresh = Math.min(Math.max(25, ((active?.accuracy || 0) + (aLoc.acc || 0))), 150);
      if (active && dM > sameLocThresh) L.polyline([[aLoc.lat, aLoc.lng], [active.latitude, active.longitude]], { color: "#1a73e8", weight: 2.5, opacity: 0.9, dashArray: "6, 6" }).addTo(layer);
    }

    if (!hasFittedRef.current && bounds.length > 0) {
      if (bounds.length === 1) map.setView(bounds[0], 15);
      else map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
      hasFittedRef.current = true;
    }
  };

  useEffect(() => {
    let active = true;
    async function init() {
      if (!mapRef.current || mapInst.current) return;
      const L = (await import("leaflet")).default;
      if (!active || !mapRef.current) return;
      const center: [number, number] = valid.length ? [valid[0].latitude, valid[0].longitude] : [31.5204, 74.3587];
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView(center, valid.length ? 15 : 12);
      if (valid.length > 0) hasFittedRef.current = true;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      const cfg = getMapTileConfig(mapMode, theme);
      tileRef.current = L.tileLayer(cfg.url, cfg.options).addTo(map);
      if (cfg.overlayUrl) overlayRef.current = L.tileLayer(cfg.overlayUrl, cfg.overlayOptions).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapInst.current = map;
      setTimeout(() => map.invalidateSize(), 250);
      renderMarkers(L, map, layerRef.current, valid, adminLoc, selectedIdx);
    }
    init();
    return () => { active = false; if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInst.current || !tileRef.current) return;
    const cfg = getMapTileConfig(mapMode, theme);
    tileRef.current.setUrl(cfg.url);
    if (cfg.overlayUrl) {
      if (!overlayRef.current) import("leaflet").then((m) => { overlayRef.current = m.default.tileLayer(cfg.overlayUrl!, cfg.overlayOptions).addTo(mapInst.current); });
      else overlayRef.current.setUrl(cfg.overlayUrl);
    } else if (overlayRef.current) { overlayRef.current.remove(); overlayRef.current = null; }
  }, [mapMode, theme]);

  useEffect(() => {
    if (mapInst.current && layerRef.current) import("leaflet").then((m) => renderMarkers(m.default, mapInst.current, layerRef.current, valid, adminLoc, selectedIdx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, adminLoc, selectedIdx]);

  const handleRecenter = () => {
    if (!mapInst.current) return;
    const bounds: [number, number][] = valid.map((p) => [p.latitude, p.longitude]);
    if (adminLoc) bounds.push([adminLoc.lat, adminLoc.lng]);
    if (bounds.length === 1) mapInst.current.setView(bounds[0], 15);
    else if (bounds.length > 1) mapInst.current.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
  };

  const currentDist = adminLoc && selectedPin ? formatDistance(calculateDistanceMeters(adminLoc.lat, adminLoc.lng, selectedPin.latitude, selectedPin.longitude), selectedPin.accuracy, adminLoc.acc) : null;

  return (
    <div className="relative w-full h-[470px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0B0B0E]">
      <div ref={mapRef} className="w-full h-full z-0 bg-[#0B0B0E]" />

      {/* Top Left: Visitor & Admin Pills */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-[#0B0B0E]/90 backdrop-blur-xl border border-white/10 shadow-md">
          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#FFFC00] animate-pulse" />
          <span className="text-[10px] font-bold text-white whitespace-nowrap">{valid.length} {valid.length === 1 ? "Visitor Pin" : "Visitor Pins"}</span>
        </div>
        {adminLoc && (
          <div className="pointer-events-auto flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-[#0B0B0E]/90 backdrop-blur-xl border border-blue-500/40 shadow-md">
            <span className="w-2 h-2 rounded-full shrink-0 bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
            <span className="text-[10px] font-bold text-blue-300 whitespace-nowrap">Admin (You)</span>
          </div>
        )}
        {selectedPin && valid.length > 1 && (
          <div className="pointer-events-auto py-1 px-2.5 rounded-xl bg-[#0B0B0E]/90 backdrop-blur-xl border border-white/10 shadow-md text-[10px] font-bold text-[#FFFC00]">
            Pin #{selectedIdx + 1} Selected
          </div>
        )}
      </div>

      {/* Side Layer Switcher: Positioned on the upper-right side (Zero collision with top pills) */}
      <div className="absolute top-11 right-2 z-10 flex items-center bg-[#0B0B0E]/90 backdrop-blur-xl border border-white/10 rounded-xl p-0.5 shadow-md">
        {(["streets", "satellite"] as const).map((m) => (
          <button key={m} onClick={() => handleModeChange(m)} className={`flex items-center gap-1 py-1 px-2 rounded-lg text-[9px] sm:text-[10px] font-bold capitalize transition-all ${mapMode === m ? "bg-[#FFFC00] text-black shadow-sm" : "text-white/60 hover:text-white"}`}>
            {m === "streets" ? <Layers className="w-3 h-3" /> : <Globe className="w-3 h-3" />}<span>{m}</span>
          </button>
        ))}
      </div>

      {/* Google Maps-style Locate / Recenter Floating Button */}
      <button onClick={handleRecenter} className="absolute bottom-20 right-2.5 z-10 p-2.5 rounded-2xl bg-[#0B0B0E]/90 hover:bg-black backdrop-blur-xl border border-white/15 text-[#FFFC00] shadow-xl active:scale-90 transition-all flex items-center justify-center group" title="Re-center map like Google Maps">
        <LocateFixed className="w-4 h-4 transition-transform group-hover:scale-110" />
      </button>

      {selectedPin ? (
        <div className="absolute bottom-2 left-2 right-2 sm:right-auto sm:max-w-xs z-10 bg-[#0B0B0E]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 sm:p-2.5 shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-mono font-bold text-[#FFFC00] truncate">{selectedPin.latitude.toFixed(4)}, {selectedPin.longitude.toFixed(4)}</span>
              <span className="text-[9px] text-white/40 font-mono shrink-0">{selectedPin.accuracy ? `±${Math.round(selectedPin.accuracy)}m` : "GPS"}</span>
            </div>
            <a href={`https://www.google.com/maps?q=${selectedPin.latitude},${selectedPin.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 py-0.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] shrink-0 transition-all active:scale-95" title="Open Google Maps">
              <Navigation className="w-2.5 h-2.5 text-[#FFFC00]" /><span>Maps</span><ExternalLink className="w-2.5 h-2.5 text-white/40" />
            </a>
          </div>
          {currentDist && (
            <button onClick={handleRecenter} title="Click to frame map between you and selected visitor" className="w-full flex items-center justify-between gap-1.5 py-1 px-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-300 text-[9px] sm:text-[10px] font-medium leading-none transition-all active:scale-[0.99]">
              <span className="flex items-center gap-1 truncate"><Compass className="w-3 h-3 text-blue-400 shrink-0" /><span className="truncate">Admin ➔ Visitor #{selectedIdx + 1}: {currentDist}</span></span>
              <span className="text-[8px] text-blue-400/70 uppercase tracking-wider shrink-0 font-bold">Fit</span>
            </button>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0B0B0E]/80 backdrop-blur-sm text-center p-6">
          <MapPin className="w-10 h-10 text-white/30 mb-2" /><h4 className="text-sm font-bold text-white">No GPS Pins Yet</h4><p className="text-xs text-white/50 mt-1 max-w-xs">When visitors allow location, their coordinates will appear here.</p>
        </div>
      )}
    </div>
  );
};
