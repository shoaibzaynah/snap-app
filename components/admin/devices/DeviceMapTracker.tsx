// components/admin/devices/DeviceMapTracker.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { DeviceLocation } from "@/lib/device-types";
import {
  getMapTileConfig, MapMode, createSnapGhostIcon, createSnapAccuracyCircle,
  createAdminLocationIcon, createAdminAccuracyCircle, calculateDistanceMeters, formatDistance, fetchAdminCoordinates,
} from "@/lib/map-utils";
import { ExternalLink, Navigation, MapPin, Compass, RefreshCw, Layers, Globe, LocateFixed } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  locations: DeviceLocation[]; childName: string; isLiveMovement?: boolean;
  onToggleLiveMovement?: (active: boolean) => void; onFetchLocation?: () => void;
}

export const DeviceMapTracker: React.FC<Props> = ({ locations, childName, isLiveMovement = false, onToggleLiveMovement, onFetchLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null), mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null), tileLayerRef = useRef<any>(null), overlayTileRef = useRef<any>(null), hasCenteredRef = useRef(false);
  const [adminLoc, setAdminLoc] = useState<{ lat: number; lng: number; acc?: number } | null>(null);
  const [mapMode, setMapMode] = useState<MapMode>("streets");
  const { theme } = useTheme();

  const valid = locations.filter((l) => Math.abs(l.latitude) > 0.001 && Math.abs(l.longitude) > 0.001 && (!l.accuracy || l.accuracy <= 1500));
  const latest = valid[0] || null;

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

  useEffect(() => {
    let isMounted = true;
    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;
      const center: [number, number] = latest ? [latest.latitude, latest.longitude] : [31.5204, 74.3587];
      const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(center, latest ? 16 : 12);
      if (latest) hasCenteredRef.current = true;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      const cfg = getMapTileConfig(mapMode, theme);
      tileLayerRef.current = L.tileLayer(cfg.url, cfg.options).addTo(map);
      if (cfg.overlayUrl) overlayTileRef.current = L.tileLayer(cfg.overlayUrl, cfg.overlayOptions).addTo(map);
      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 250);
    }
    initMap();
    return () => { isMounted = false; if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const cfg = getMapTileConfig(mapMode, theme);
    if (tileLayerRef.current) tileLayerRef.current.remove();
    import("leaflet").then((m) => {
      if (!mapInstanceRef.current) return;
      tileLayerRef.current = m.default.tileLayer(cfg.url, cfg.options).addTo(mapInstanceRef.current);
    });
  }, [mapMode, theme]);

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
          const dist = calculateDistanceMeters(prev[0], prev[1], p.latitude, p.longitude);
          if (dist >= Math.max(40, (p.accuracy || 20) * 0.75) && dist <= 3000) trail.push([p.latitude, p.longitude]);
        }
      }

      const totalSpan = trail.length > 1 ? calculateDistanceMeters(trail[0][0], trail[0][1], trail[trail.length - 1][0], trail[trail.length - 1][1]) : 0;
      if (trail.length > 1 && totalSpan >= 50) {
        L.polyline(trail, { color: "#FFFC00", weight: 3.5, opacity: 0.8, dashArray: "6, 8" }).addTo(layerGroupRef.current);
        trail.slice(0, -1).slice(-15).forEach(([lat, lng]) => L.circleMarker([lat, lng], { radius: 3.5, color: "#000", fillColor: "#FFFC00", fillOpacity: 0.75, weight: 1.5 }).addTo(layerGroupRef.current));
      }

      if (current.accuracy) createSnapAccuracyCircle(L, [current.latitude, current.longitude], current.accuracy).addTo(layerGroupRef.current);
      const childMarker = L.marker([current.latitude, current.longitude], { icon: createSnapGhostIcon(L, 38) }).addTo(layerGroupRef.current);

      let distanceStr = "";
      if (adminLoc) {
        const dMeters = calculateDistanceMeters(adminLoc.lat, adminLoc.lng, current.latitude, current.longitude);
        distanceStr = formatDistance(dMeters, current.accuracy, adminLoc.acc);
        const aMarker = L.marker([adminLoc.lat, adminLoc.lng], { icon: createAdminLocationIcon(L, 30), zIndexOffset: 3000 }).addTo(layerGroupRef.current);
        if (adminLoc.acc) createAdminAccuracyCircle(L, [adminLoc.lat, adminLoc.lng], adminLoc.acc).addTo(layerGroupRef.current);
        aMarker.bindPopup(`<div style="color:#000;font-family:sans-serif;font-size:13px;padding:4px;"><strong style="font-size:14px;display:block;">📍 Admin Location (You)</strong><span style="color:#555;font-size:12px;">GPS Acc: ±${Math.round(adminLoc.acc || 0)}m</span><br/><strong style="font-size:12px;">Distance to ${childName}: ${distanceStr}</strong></div>`);

        const sameLocThreshold = Math.min(Math.max(25, (current.accuracy || 0) + (adminLoc.acc || 0)), 150);
        if (dMeters > sameLocThreshold) L.polyline([[adminLoc.lat, adminLoc.lng], [current.latitude, current.longitude]], { color: "#1a73e8", weight: 2.5, opacity: 0.85, dashArray: "6, 6" }).addTo(layerGroupRef.current);
      }

      childMarker.bindPopup(`<div style="color:#000;font-family:sans-serif;padding:4px;min-width:180px;"><strong style="font-size:14px;display:block;">${childName}'s Live Location</strong><span style="font-size:12px;color:#555;display:block;">${new Date(current.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} &bull; Acc: ±${Math.round(current.accuracy || 0)}m</span>${distanceStr ? `<div style="margin:4px 0;font-size:12px;color:#1a73e8;font-weight:bold;">📏 ${distanceStr}</div>` : ""}<a href="https://www.google.com/maps?q=${current.latitude},${current.longitude}" target="_blank" style="display:inline-block;font-size:12px;background:#000;color:#FFFC00;padding:5px 10px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:4px;">Open in Google Maps &rarr;</a></div>`);

      if (!hasCenteredRef.current && current && mapInstanceRef.current) {
        mapInstanceRef.current.setView([current.latitude, current.longitude], 16);
        hasCenteredRef.current = true;
      }
      // Camera is completely free when user pans or drags — no snapping back!
    }
    updateMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, childName, adminLoc]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    if (adminLoc && latest) mapInstanceRef.current.fitBounds([[adminLoc.lat, adminLoc.lng], [latest.latitude, latest.longitude]], { padding: [50, 50], maxZoom: 17 });
    else if (adminLoc) mapInstanceRef.current.setView([adminLoc.lat, adminLoc.lng], 16);
    else if (latest) mapInstanceRef.current.setView([latest.latitude, latest.longitude], 16);
  };

  const currentDist = adminLoc && latest ? formatDistance(calculateDistanceMeters(adminLoc.lat, adminLoc.lng, latest.latitude, latest.longitude), latest.accuracy, adminLoc.acc) : null;

  return (
    <div className="relative w-full h-[470px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl snap-map-overlay" data-map-overlay="true">
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#0B0B0E]" />

      {/* Unified Top HUD Row: Status & Actions on Left, Layer Switcher on Right (Smart Compact Chips) */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none gap-1">
        <div className="flex items-center gap-1 flex-wrap max-w-[calc(100%-110px)]">
          <div className="pointer-events-auto h-6 flex items-center gap-1 px-2 rounded-md bg-[#0B0B0E]/90 backdrop-blur-md border border-white/10 shadow-sm">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLiveMovement ? "bg-emerald-400 animate-pulse" : "bg-white/40"}`} />
            <span className="text-[10px] font-bold text-white whitespace-nowrap">{isLiveMovement ? "Live 3s" : latest ? "GPS" : "No GPS"}</span>
          </div>
          {onToggleLiveMovement && (
            <button onClick={() => onToggleLiveMovement(!isLiveMovement)} className={`pointer-events-auto h-6 px-2 rounded-md text-[10px] font-bold border transition-all shadow-sm flex items-center gap-1 ${isLiveMovement ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-[#0B0B0E]/90 hover:bg-black border-white/10 text-white/70"}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLiveMovement ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
              <span>{isLiveMovement ? "Tracking" : "Track"}</span>
            </button>
          )}
          {onFetchLocation && (
            <button onClick={onFetchLocation} className="pointer-events-auto h-6 px-2 rounded-md text-[10px] font-bold border border-white/10 bg-[#0B0B0E]/90 hover:bg-black text-white/70 hover:text-white transition-all shadow-sm flex items-center gap-1 active:scale-95" title="Fetch fresh GPS fix">
              <RefreshCw className="w-2.5 h-2.5 text-[#FFFC00]" /><span>Fetch</span>
            </button>
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

      {/* Google Maps-style Locate / Recenter Floating Button */}
      <button onClick={handleRecenter} className="absolute bottom-20 right-2.5 z-10 p-2.5 rounded-2xl bg-[#0B0B0E]/90 hover:bg-black backdrop-blur-xl border border-white/15 text-[#FFFC00] shadow-xl active:scale-90 transition-all flex items-center justify-center group" title="Re-center map like Google Maps">
        <LocateFixed className="w-4 h-4 transition-transform group-hover:scale-110" />
      </button>

      {latest ? (
        <div className="absolute bottom-2 left-2 right-2 sm:right-auto sm:max-w-xs z-10 bg-[#0B0B0E]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2.5 shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-sm font-mono font-bold text-[#FFFC00] truncate">{latest.latitude.toFixed(4)}, {latest.longitude.toFixed(4)}</span>
              <span className="text-xs text-white/70 font-mono shrink-0">{latest.accuracy ? `±${Math.round(latest.accuracy)}m` : "GPS"}</span>
            </div>
            <a href={`https://www.google.com/maps?q=${latest.latitude},${latest.longitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-[#FFFC00] hover:bg-[#FFFC00]/90 text-black font-bold text-xs shrink-0 transition-all active:scale-95 shadow-sm" title="Open Google Maps">
              <Navigation className="w-3 h-3 text-black" /><span>Maps</span><ExternalLink className="w-3 h-3 text-black/60" />
            </a>
          </div>
          {currentDist && (
            <button onClick={handleRecenter} title="Click to frame map between you and child" className="w-full flex items-center justify-between gap-1.5 py-1 px-2.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-300 text-xs font-medium leading-none transition-all active:scale-[0.99]">
              <span className="flex items-center gap-1 truncate"><Compass className="w-3.5 h-3.5 text-blue-400 shrink-0" /><span className="truncate">Distance to Us: {currentDist}</span></span>
              <span className="text-[10px] text-blue-400 uppercase tracking-wider shrink-0 font-bold">Fit</span>
            </button>
          )}
        </div>
      ) : (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0B0B0E]/80 backdrop-blur-sm text-center p-6">
          <MapPin className="w-10 h-10 text-white/30 mb-2" /><h4 className="text-sm font-bold text-white">No GPS Points Yet</h4><p className="text-xs text-white/50 mt-1 max-w-xs">Coordinates will appear here as soon as the companion app reports location.</p>
        </div>
      )}
    </div>
  );
};
