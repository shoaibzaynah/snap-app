// app/admin/devices/[id]/loading.tsx
import React from "react";
import { Skeleton, MapCanvasSkeleton } from "@/components/ui/Skeleton";

export default function DeviceDetailLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Device Header Skeleton */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#141418] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
        ))}
      </div>

      {/* Main Tab Area Skeleton (Map Canvas) */}
      <MapCanvasSkeleton />
    </div>
  );
}
