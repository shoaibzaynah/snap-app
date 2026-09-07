// components/admin/LinkDetailMap.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { DeviceInfo } from "@/lib/types";

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

  const renderMarkers = (L: any, map: any, layerGroup: any, items: LinkVisitorPin[]) => {
    layerGroup.clearLayers();
    if (items.length === 0) return;

    const bounds: [number, number][] = [];

    items.forEach((c) => {
      const pos: [number, number] = [c.latitude, c.longitude];
      bounds.push(pos);

      // Signature Snapchat Ghost Marker with yellow glow & pulse
      const ghostIcon = L.divIcon({
        className: "snap-marker-pin",
        html: `
          <div style="
            position: relative;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              position: absolute;
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(255,252,0,0.5) 0%, rgba(255,252,0,0) 70%);
              animation: pulse 2s infinite;
            "></div>
            <div style="
              position: relative;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background-color: #FFFC00;
              border: 2px solid #000;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 0 16px rgba(255,252,0,0.9);
            ">
              <span style="font-size: 15px; line-height: 1;">👻</span>
            </div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      const marker = L.marker(pos, { icon: ghostIcon }).addTo(layerGroup);

      // Accuracy circle
      if (c.accuracy) {
        L.circle(pos, {
          radius: c.accuracy,
          color: "#FFFC00",
          fillColor: "#FFFC00",
          fillOpacity: 0.14,
          weight: 1.5,
        }).addTo(layerGroup);
      }

      // Popup with device specs and 1-click Google Maps redirect
      const gmapsUrl = `https://www.google.com/maps?q=${c.latitude},${c.longitude}`;
      const devStr = [
        c.deviceInfo?.os,
        c.deviceInfo?.browser,
        c.deviceInfo?.battery !== undefined && c.deviceInfo?.battery !== null ? `${c.deviceInfo.battery}%` : null,
      ]
        .filter(Boolean)
        .join(" • ");

      marker.bindPopup(`
        <div style="color: #000; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; min-width: 190px;">
          <p style="font-weight: 800; margin: 0 0 3px 0; font-size: 13px; color: #000;">Visitor Location</p>
          ${c.ipAddress ? `<p style="margin: 0 0 2px 0; color: #333; font-size: 11px;">IP: <b>${c.ipAddress}</b></p>` : ""}
          ${devStr ? `<p style="margin: 0 0 4px 0; color: #555; font-size: 11px;">${devStr}</p>` : ""}
          <p style="margin: 0 0 4px 0; color: #444; font-size: 11px; font-family: monospace;">${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}</p>
          ${c.accuracy ? `<p style="margin: 0 0 8px 0; color: #777; font-size: 10px;">Accuracy: ±${Math.round(c.accuracy)}m</p>` : ""}
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="
            display: inline-block;
            background-color: #000;
            color: #FFFC00;
            text-decoration: none;
            padding: 5px 12px;
            border-radius: 9999px;
            font-weight: bold;
            font-size: 11px;
          ">Open in Google Maps ↗</a>
        </div>
      `);
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      const center: [number, number] = coordinates.length > 0
        ? [coordinates[0].latitude, coordinates[0].longitude]
        : [31.5204, 74.3587];

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, coordinates.length > 0 ? 15 : 12);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY || "";
      const tileUrl = cartoKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${cartoKey}`
        : `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png`;

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Immediate guaranteed render on init
      renderMarkers(L, map, layerGroup, coordinates);
    }

    init();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Re-render markers if coordinates update
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;
    import("leaflet").then((mod) => {
      renderMarkers(mod.default, mapInstanceRef.current, layerGroupRef.current, coordinates);
    });
  }, [coordinates]);

  return (
    <div className="relative w-full h-80 rounded-3xl overflow-hidden border border-white/10 bg-[#121216] shadow-xl">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
