"use client";

import React, { useEffect, useRef } from "react";
import { LiveLocationItem } from "@/hooks/useRealtimeLocations";
import { ExternalLink, Navigation } from "lucide-react";

interface LiveMapProps {
  locations: LiveLocationItem[];
}

export const LiveMap: React.FC<LiveMapProps> = ({ locations }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Default center (India / Global center)
      const defaultCenter: [number, number] = [20.5937, 78.9629];
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(defaultCenter, 5);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY || "";
      const tileUrl = cartoKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png?key=${cartoKey}`
        : `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png`;

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    async function updateMarkers() {
      if (!mapInstanceRef.current || !layerGroupRef.current) return;
      const L = (await import("leaflet")).default;

      layerGroupRef.current.clearLayers();

      if (locations.length === 0) return;

      const bounds: [number, number][] = [];

      locations.forEach((loc) => {
        const pos: [number, number] = [loc.latitude, loc.longitude];
        bounds.push(pos);

        // Snapchat Yellow pulsing marker icon
        const customIcon = L.divIcon({
          className: "custom-snap-marker",
          html: `
            <div style="
              width: 24px;
              height: 24px;
              background-color: #FFFC00;
              border: 3px solid #000;
              border-radius: 50%;
              box-shadow: 0 0 16px #FFFC00;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
            ">👻</div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker(pos, { icon: customIcon }).addTo(layerGroupRef.current);

        // Accuracy circle
        if (loc.accuracy && loc.accuracy > 0) {
          L.circle(pos, {
            radius: loc.accuracy,
            color: "#FFFC00",
            fillColor: "#FFFC00",
            fillOpacity: 0.12,
            weight: 1,
          }).addTo(layerGroupRef.current);
        }

        // Popup with Google Maps 1-click redirect and link tracking
        const gmapsUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
        const deviceStr = [
          loc.deviceInfo?.os,
          loc.deviceInfo?.browser,
          loc.deviceInfo?.battery !== undefined && loc.deviceInfo?.battery !== null ? `${loc.deviceInfo.battery}%` : null,
        ]
          .filter(Boolean)
          .join(" • ");

        const popupContent = `
          <div style="color: #000; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; min-width: 190px;">
            <p style="font-weight: 800; margin: 0 0 3px 0; font-size: 13px;">${loc.linkTitle}</p>
            ${loc.ipAddress ? `<p style="margin: 0 0 2px 0; color: #444; font-size: 11px;">IP: <b>${loc.ipAddress}</b></p>` : ""}
            ${deviceStr ? `<p style="margin: 0 0 4px 0; color: #666; font-size: 11px;">${deviceStr}</p>` : ""}
            <p style="margin: 0 0 4px 0; color: #555; font-size: 11px;">Lat: ${loc.latitude.toFixed(5)}, Lng: ${loc.longitude.toFixed(5)}</p>
            ${loc.accuracy ? `<p style="margin: 0 0 8px 0; color: #777; font-size: 10px;">Accuracy: ±${Math.round(loc.accuracy)}m</p>` : ""}
            <div style="display: flex; gap: 6px; margin-top: 6px;">
              <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="
                display: inline-block;
                background-color: #000;
                color: #FFFC00;
                text-decoration: none;
                padding: 5px 10px;
                border-radius: 9999px;
                font-weight: bold;
                font-size: 11px;
              ">Google Maps ↗</a>
              ${loc.linkId ? `
              <a href="/admin/links/${loc.linkId}" style="
                display: inline-block;
                background-color: #eee;
                color: #000;
                text-decoration: none;
                padding: 5px 10px;
                border-radius: 9999px;
                font-weight: 600;
                font-size: 11px;
              ">Track Link</a>` : ""}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
      });

      if (bounds.length > 0) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }

    updateMarkers();
  }, [locations]);

  return (
    <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0F0F12]">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
