// app/admin/links/loading.tsx
import React from "react";
import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";

export default function AdminLinksLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-2 w-full">
        <Skeleton className="h-7 w-52 sm:w-72" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* Share Links Table Rows Skeleton */}
      <div className="space-y-3">
        <TableRowSkeleton rows={6} />
      </div>
    </div>
  );
}
