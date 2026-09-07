"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useRealtimeLocations } from "@/hooks/useRealtimeLocations";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Navigation, ExternalLink, RefreshCw } from "lucide-react";
import { timeAgo } from "@/lib/utils";

// Dynamic import for Leaflet map component (client-only)
const LiveMap = dynamic(
  () => import("@/components/admin/LiveMap").then((mod) => mod.LiveMap),
  { ssr: false, loading: () => <div className="w-full h-[520px] rounded-3xl bg-[#0F0F12] animate-pulse flex items-center justify-center text-white/50">Loading OpenStreetMap...</div> }
);

export default function AdminLocationsPage() {
  const { locations, isLoading, lastEventTime, refetch } = useRealtimeLocations();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            Live Geolocation <span className="text-[#FFFC00]">Tracker</span>
          </h1>
          <p className="text-xs text-white/50">
            Real-time telemetry on OpenStreetMap with 1-click Google Maps navigation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="live" className="text-xs">
            Realtime Connected
          </Badge>
          <Button onClick={refetch} variant="secondary" size="sm" className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Map Component */}
      <LiveMap locations={locations} />

      {/* Active Sessions List */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#FFFC00]" />
          Active Consented Sessions ({locations.length})
        </h2>

        {locations.length === 0 ? (
          <Card variant="glass" className="p-6 text-center text-xs text-white/50">
            No active consented sessions transmitting coordinates right now.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {locations.map((loc) => {
              const gmapsUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
              return (
                <Card
                  key={loc.sessionId}
                  variant="glass"
                  className="p-4 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 truncate">
                    <p className="text-sm font-bold text-white truncate">
                      {loc.linkTitle}
                    </p>
                    <p className="text-xs text-[#FFFC00] font-mono">
                      {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                    </p>
                    <p className="text-[11px] text-white/50">
                      Updated {timeAgo(loc.updatedAt)} • Accuracy: ±{Math.round(loc.accuracy || 0)}m
                    </p>
                  </div>

                  <a
                    href={gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button size="sm" className="gap-1 text-xs">
                      <Navigation className="w-3 h-3" />
                      Google Maps ↗
                    </Button>
                  </a>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
