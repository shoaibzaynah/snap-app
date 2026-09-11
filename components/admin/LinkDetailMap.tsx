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

  const handleModeChange = (m: MapMode) => { setMapMode(m); if (typeof window !== "undefined") localStorage.setItem("snap_map_mode", m); };

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
      marker.bindPopup(`<div style="color:#000;font-family:sans-serif;padding:4px;min-width:180px;"><strong style="font-size:14px;display:block;">Visitor #${idx + 1}</strong>${c.ipAddress ? `<span style="font-size:12px;color:#333;display:block;">IP: <b>${c.ipAddress}</b></span>` : ""}${dev ? `<span style="font-size:12px;color:#555;display:block;">${dev}</span>` : ""}<span style="font-size:12px;color:#555;display:block;">${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)} &bull; ±${Math.round(c.accuracy || 0)}m</span>${dAdm ? `<div style="margin:4px 0;font-size:12px;color:#1a73e8;font-weight:bold;">📏 Admin to Visitor: ${dAdm}</div>` : ""}<a href="${gmaps}" target="_blank" rel="noopener noreferrer" style="display:inline-block;font-size:12px;background:#000;color:#FFFC00;padding:5px 10px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:4px;">Open in Google Maps &rarr;</a></div>`);
    });

    if (aLoc) {
      bounds.push([aLoc.lat, aLoc.lng]);
      const aMarker = L.marker([aLoc.lat, aLoc.lng], { icon: createAdminLocationIcon(L, 30), zIndexOffset: 3000 }).addTo(layer);
      if (aLoc.acc) createAdminAccuracyCircle(L, [aLoc.lat, aLoc.lng], aLoc.acc).addTo(layer);
      const dM = active ? calculateDistanceMeters(aLoc.lat, aLoc.lng, active.latitude, active.longitude) : 0;
      const dToAct = active ? formatDistance(dM, active.accuracy, aLoc.acc) : null;
      aMarker.bindPopup(`<div style="color:#000;font-family:sans-serif;font-size:13px;padding:4px;"><strong style="font-size:14px;display:block;">📍 Admin Location (You)</strong><span style="color:#555;font-size:12px;">GPS Acc: ±${Math.round(aLoc.acc || 0)}m</span>${dToAct ? `<br/><strong style="font-size:12px;">Admin to Visitor #${activeIdx + 1}: ${dToAct}</strong>` : ""}</div>`);
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
    if (!mapInst.current) return;
    const cfg = getMapTileConfig(mapMode, theme);
    if (tileRef.current) tileRef.current.remove();
    import("leaflet").then((m) => {
      if (!mapInst.current) return;
      tileRef.current = m.default.tileLayer(cfg.url, cfg.options).addTo(mapInst.current);
    });
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
    <div className="relative w-full h-[470px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0B0B0E] snap-map-overlay" data-map-overlay="true">
      <div ref={mapRef} className="w-full h-full z-0 bg-[#0B0B0E]" />

      {/* Unified Top HUD Row: Status on Left, Layer Switcher on Right (Smart Compact Chips) */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none gap-1">
        <div className="flex items-center gap-1 flex-wrap max-w-[calc(100%-110px)]">
          <div className="pointer-events-auto h-6 flex items-center gap-1 px-2 rounded-md bg-[#0B0B0E]/90 backdrop-blur-md border border-white/10 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#FFFC00] animate-pulse" />
            <span className="text-[10px] font-bold text-white whitespace-nowrap">{valid.length} {valid.length === 1 ? "Pin" : "Pins"}</span>
          </div>
          {adminLoc && (
            <div className="pointer-events-auto h-6 flex items-center gap-1 px-2 rounded-md bg-[#0B0B0E]/90 backdrop-blur-md border border-blue-500/40 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-blue-500 shadow-[0_0_6px_#3b82f6] animate-pulse" />
              <span className="text-[10px] font-bold text-blue-300 whitespace-nowrap">Admin<span className="hidden sm:inline"> (You)</span></span>
            </div>
          )}
        </div>

        {/* Top Right: Compact Layer Switcher */}
        <div className="pointer-events-auto shrink-0 h-6 flex items-center bg-[#0B0B0E]/90 backdrop-blur-md border border-white/10 rounded-md p-0.5 shadow-sm">
          {(["streets", "satellite"] as const).map((m) => (
            <button key={m} onClick={() => handleModeChange(m)} className={`h-full flex items-center gap-1 px-1.5 rounded text-[10px] font-bold capitalize transition-all ${mapMode === m ? "bg-[#FFFC00] text-black shadow-sm" : "text-white/70 hover:text-white"}`}>
              {m === "streets" ? <Layers className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}<span>{m}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sleek Floating Control Cluster: Recenter + Custom Dark Zoom */}
      <div className="absolute bottom-2 right-2.5 z-10 flex flex-col items-center gap-1.5">
        <button onClick={handleRecenter} className="w-8 h-8 rounded-xl bg-[#0B0B0E]/90 hover:bg-black backdrop-blur-xl border border-white/15 text-[#FFFC00] shadow-xl active:scale-90 transition-all flex items-center justify-center group" title="Re-center map">
          <LocateFixed className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
        </button>
        <div className="flex flex-col rounded-xl overflow-hidden bg-[#0B0B0E]/90 backdrop-blur-xl border border-white/15 shadow-xl">
          <button onClick={() => mapInst.current?.zoomIn()} className="w-8 h-6 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all text-xs font-bold border-b border-white/10" title="Zoom In">+</button>
          <button onClick={() => mapInst.current?.zoomOut()} className="w-8 h-6 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all text-xs font-bold" title="Zoom Out">&minus;</button>
        </div>
      </div>

      {selectedPin ? (
        <div className="absolute bottom-2 left-2 z-10 w-[calc(100%-54px)] sm:w-auto sm:max-w-xs bg-[#0B0B0E]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 shadow-2xl space-y-1.5">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[11px] font-mono font-bold text-[#FFFC00] truncate">{selectedPin.latitude.toFixed(5)}, {selectedPin.longitude.toFixed(5)}</span>
              <span className="text-[9px] text-white/50 font-mono shrink-0">{selectedPin.accuracy ? `±${Math.round(selectedPin.accuracy)}m` : "GPS"}</span>
            </div>
            <a href={`https://www.google.com/maps?q=${selectedPin.latitude},${selectedPin.longitude}`} target="_blank" rel="noopener noreferrer" className="h-6 px-2 rounded-md bg-[#FFFC00] hover:bg-[#FFFC00]/90 text-black font-black text-[10px] shrink-0 transition-all active:scale-95 shadow-sm flex items-center gap-1" title="Open Google Maps">
              <Navigation className="w-2.5 h-2.5 text-black" /><span>Maps</span><ExternalLink className="w-2.5 h-2.5 text-black/60" />
            </a>
          </div>
          {currentDist && (
            <button onClick={handleRecenter} title="Click to frame map between you and selected visitor" className="w-full h-5 flex items-center justify-between gap-1 px-2 rounded-md bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-300 text-[10px] font-medium leading-none transition-all active:scale-[0.99]">
              <span className="flex items-center gap-1 truncate"><Compass className="w-2.5 h-2.5 text-blue-400 shrink-0" /><span className="truncate">Admin ➔ Visitor #{selectedIdx + 1}: {currentDist}</span></span>
              <span className="text-[9px] text-blue-400 uppercase tracking-wider shrink-0 font-bold">Fit</span>
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
