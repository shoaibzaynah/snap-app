// app/admin/locations/loading.tsx
import React from "react";
import { Skeleton, MapCanvasSkeleton, TableRowSkeleton } from "@/components/ui/Skeleton";

export default function AdminLocationsLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-52 sm:w-72" />
          <Skeleton className="h-3 w-40 sm:w-60" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>

      {/* Top Filter Badges Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        <Skeleton className="h-7 w-24 rounded-full shrink-0" />
        <Skeleton className="h-7 w-32 rounded-full shrink-0" />
        <Skeleton className="h-7 w-28 rounded-full shrink-0" />
      </div>

      {/* Full Map Canvas Skeleton with Radar Pulse Ghost Marker */}
      <MapCanvasSkeleton />

      {/* Telemetry Group Cards Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-44" />
        <TableRowSkeleton rows={3} />
      </div>
    </div>
  );
}
