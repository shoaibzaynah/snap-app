// app/admin/devices/loading.tsx
import React from "react";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function AdminDevicesLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-8 h-8 rounded-xl" />
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 sm:p-4 rounded-2xl bg-[#141418] border border-white/10 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>

      {/* Device Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl sm:rounded-3xl bg-[#141418] border border-white/10 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-2xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
