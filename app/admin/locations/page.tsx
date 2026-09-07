// app/admin/locations/page.tsx
"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useRealtimeLocations } from "@/hooks/useRealtimeLocations";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LinkLocationGroupCard } from "@/components/admin/LinkLocationGroupCard";
import { MapPin, RefreshCw, Users, Link2 } from "lucide-react";

const LiveMap = dynamic(
  () => import("@/components/admin/LiveMap").then((mod) => mod.LiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-3xl bg-[#0F0F12] animate-pulse flex items-center justify-center text-white/50 text-xs">
        Loading OpenStreetMap...
      </div>
    ),
  }
);

export default function AdminLocationsPage() {
  const { locations, linksSummary, totalVisitors, refetch } = useRealtimeLocations();
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  // Filter locations if a specific link is selected
  const displayedLocations = selectedLinkId
    ? locations.filter((l) => l.linkId === selectedLinkId)
    : locations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            Live Geolocation <span className="text-[#FFFC00]">Tracker</span>
          </h1>
          <p className="text-xs text-white/50">
            Real-time telemetry on OpenStreetMap with link-by-link visitor tracking
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

      {/* Top Overview Metrics (Bahir ki tarah real visitors count) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card variant="glass" className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <Users className="w-4 h-4 text-[#FFFC00]" />
            <span>Total Visitors</span>
          </div>
          <p className="text-2xl font-black text-white">{totalVisitors}</p>
        </Card>

        <Card variant="glass" className="p-4 space-y-1">
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Active Pins</span>
          </div>
          <p className="text-2xl font-black text-white">{displayedLocations.length}</p>
        </Card>

        <Card variant="glass" className="p-4 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <Link2 className="w-4 h-4 text-blue-400" />
            <span>Monitored Links</span>
          </div>
          <p className="text-2xl font-black text-white">{linksSummary.length}</p>
        </Card>
      </div>

      {/* Link Filter Selector (Har ek link apne apne) */}
      {linksSummary.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-white/40 font-bold uppercase mr-1">Filter Link:</span>
          <button
            onClick={() => setSelectedLinkId(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedLinkId === null
                ? "bg-[#FFFC00] text-black shadow-md shadow-yellow-500/20"
                : "bg-white/5 text-white/60 hover:text-white border border-white/10"
            }`}
          >
            All Links ({locations.length})
          </button>

          {linksSummary.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedLinkId(l.id === selectedLinkId ? null : l.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedLinkId === l.id
                  ? "bg-[#FFFC00] text-black shadow-md shadow-yellow-500/20"
                  : "bg-white/5 text-white/60 hover:text-white border border-white/10"
              }`}
            >
              <span className="truncate max-w-[130px]">{l.title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-bold">
                {l.totalVisitors}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Map */}
      <LiveMap locations={displayedLocations} />

      {/* Link-by-Link Breakdown (Bahir ki tarah real visitors per link) */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FFFC00]" />
            Visitors Telemetry by Link
          </span>
          <span className="text-xs font-normal text-white/50 font-mono">
            {displayedLocations.length} active sessions
          </span>
        </h2>

        {linksSummary.length === 0 ? (
          <Card variant="glass" className="p-8 text-center text-xs text-white/50">
            No links active yet. Create a link to start capturing visitors.
          </Card>
        ) : (
          linksSummary
            .filter((l) => (selectedLinkId ? l.id === selectedLinkId : true))
            .map((link) => (
              <LinkLocationGroupCard
                key={link.id}
                link={link}
                locations={locations.filter((loc) => loc.linkId === link.id)}
              />
            ))
        )}
      </div>
    </div>
  );
}
