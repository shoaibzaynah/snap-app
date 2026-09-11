// app/admin/loading.tsx
import React from "react";
import { Skeleton, CardSkeleton, TableRowSkeleton } from "@/components/ui/Skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-2 w-full">
        <Skeleton className="h-7 w-48 sm:w-64" />
        <Skeleton className="h-8 w-24 sm:w-32 rounded-full" />
      </div>

      {/* Metrics Grid */}
      <CardSkeleton count={4} className="grid-cols-2 lg:grid-cols-4" />

      {/* Quick Action Banner Skeleton */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#141418] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>

      {/* Recent Links Section Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-36" />
        <TableRowSkeleton rows={4} />
      </div>
    </div>
  );
}
