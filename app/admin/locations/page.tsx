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
import { formatSocialTitle } from "@/lib/text-utils";

const LiveMap = dynamic(
  () => import("@/components/admin/LiveMap").then((mod) => mod.LiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[470px] rounded-3xl bg-[#0F0F12] animate-pulse flex items-center justify-center text-white/50 text-xs">
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
      {/* Header: Anti-Clash Single Row with Responsive Width Button */}
      <div className="space-y-1 sm:space-y-2">
        <div className="flex items-center justify-between gap-2 w-full">
          <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2 tracking-tight truncate min-w-0">
            <span className="truncate">Live Geolocation <span className="text-amber-600 dark:text-[#FFFC00]">Tracker</span></span>
          </h1>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Badge variant="live" className="text-[9px] sm:text-xs px-2 py-0.5">
              <span className="sm:hidden">Live</span>
              <span className="hidden sm:inline">Realtime Connected</span>
            </Badge>
            <Button onClick={refetch} variant="secondary" size="sm" className="h-7 sm:h-8 md:h-9 px-2.5 sm:px-3.5 rounded-full border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:border-[#FFFC00]/50 gap-1 sm:gap-1.5 font-bold text-[10px] sm:text-xs">
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        <p className="text-[11px] sm:text-xs md:text-sm text-slate-500 dark:text-white/50">
          Real-time telemetry on OpenStreetMap with link-by-link visitor tracking
        </p>
      </div>

      {/* Top Overview Metrics */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        <Card variant="glass" className="p-2.5 sm:p-4 space-y-1 rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-1 sm:gap-2 text-slate-500 dark:text-white/50 text-[10px] sm:text-xs truncate">
            <Users className="w-3.5 h-3.5 text-amber-600 dark:text-[#FFFC00] shrink-0" />
            <span className="truncate">Visitors</span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">{totalVisitors}</p>
        </Card>

        <Card variant="glass" className="p-2.5 sm:p-4 space-y-1 rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-1 sm:gap-2 text-slate-500 dark:text-white/50 text-[10px] sm:text-xs truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Pins</span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">{displayedLocations.length}</p>
        </Card>

        <Card variant="glass" className="p-2.5 sm:p-4 space-y-1 rounded-xl sm:rounded-2xl border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-1 sm:gap-2 text-slate-500 dark:text-white/50 text-[10px] sm:text-xs truncate">
            <Link2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Links</span>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">{linksSummary.length}</p>
        </Card>
      </div>

      {/* Link Filter Selector */}
      {linksSummary.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full">
          <span className="text-[10px] sm:text-xs text-slate-500 dark:text-white/40 font-bold uppercase tracking-wider shrink-0 mr-1">Filter:</span>
          <button
            onClick={() => setSelectedLinkId(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
              selectedLinkId === null
                ? "bg-[#FFFC00] text-black shadow-md shadow-yellow-500/20 font-bold"
                : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
            }`}
          >
            All Links ({locations.length})
          </button>

          {linksSummary.map((l) => (
            <button
              key={l.id}
              onClick={() => setSelectedLinkId(l.id === selectedLinkId ? null : l.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                selectedLinkId === l.id
                  ? "bg-[#FFFC00] text-black shadow-md shadow-yellow-500/20 font-bold"
                  : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
              }`}
            >
              <span className="truncate max-w-[140px]">{formatSocialTitle(l.title)}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-black/40 font-bold">
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
