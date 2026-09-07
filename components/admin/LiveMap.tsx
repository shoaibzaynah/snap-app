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

      // Dark CartoDB / OSM tiles (zero API key)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
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

        // Popup with Google Maps 1-click redirect
        const gmapsUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
        const popupContent = `
          <div style="color: #000; font-family: sans-serif; font-size: 12px; min-width: 170px;">
            <p style="font-weight: bold; margin: 0 0 4px 0; font-size: 13px;">${loc.linkTitle}</p>
            <p style="margin: 0 0 4px 0; color: #555;">Lat: ${loc.latitude.toFixed(5)}, Lng: ${loc.longitude.toFixed(5)}</p>
            ${loc.accuracy ? `<p style="margin: 0 0 8px 0; color: #777;">Accuracy: ±${Math.round(loc.accuracy)}m</p>` : ""}
            <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" style="
              display: inline-block;
              background-color: #000;
              color: #FFFC00;
              text-decoration: none;
              padding: 6px 12px;
              border-radius: 9999px;
              font-weight: bold;
              font-size: 11px;
            ">Open in Google Maps ↗</a>
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
