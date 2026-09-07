// components/admin/LinkDetailMap.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { GeoCoordinate } from "@/lib/types";

interface LinkDetailMapProps {
  coordinates: Array<GeoCoordinate & { title?: string; timestamp?: string }>;
}

export const LinkDetailMap: React.FC<LinkDetailMapProps> = ({ coordinates }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      const defaultCenter: [number, number] = coordinates.length > 0
        ? [coordinates[0].latitude, coordinates[0].longitude]
        : [20.5937, 78.9629];

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(defaultCenter, coordinates.length > 0 ? 12 : 3);

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
  }, [coordinates]);

  useEffect(() => {
    async function updateMarkers() {
      if (!mapInstanceRef.current || !layerGroupRef.current) return;
      const L = (await import("leaflet")).default;
      layerGroupRef.current.clearLayers();

      if (coordinates.length === 0) return;

      const bounds: [number, number][] = [];

      coordinates.forEach((c) => {
        const pos: [number, number] = [c.latitude, c.longitude];
        bounds.push(pos);

        const customIcon = L.divIcon({
          className: "custom-pin",
          html: `<div style="
            background: #FFFC00;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 3px solid #000;
            box-shadow: 0 0 12px rgba(255,252,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 6px; height: 6px; background: #000; border-radius: 50%;"></div>
          </div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        const marker = L.marker(pos, { icon: customIcon }).addTo(layerGroupRef.current);

        if (c.accuracy) {
          L.circle(pos, {
            radius: c.accuracy,
            color: "#FFFC00",
            fillColor: "#FFFC00",
            fillOpacity: 0.12,
            weight: 1,
          }).addTo(layerGroupRef.current);
        }

        const googleMapsUrl = `https://www.google.com/maps?q=${c.latitude},${c.longitude}`;
        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; color: #fff; background: #121216; border-radius: 8px;">
            <p style="font-weight: bold; font-size: 12px; margin: 0 0 4px 0; color: #FFFC00;">${c.title || "Visitor Location"}</p>
            <p style="font-size: 11px; margin: 0 0 4px 0; font-family: monospace;">${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}</p>
            <a href="${googleMapsUrl}" target="_blank" style="display: inline-block; font-size: 11px; color: #FFFC00; text-decoration: underline;">Open in Google Maps ↗</a>
          </div>
        `);
      });

      if (bounds.length > 0) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }

    updateMarkers();
  }, [coordinates]);

  return (
    <div className="relative w-full h-80 rounded-3xl overflow-hidden border border-white/10 bg-[#121216] shadow-xl">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
