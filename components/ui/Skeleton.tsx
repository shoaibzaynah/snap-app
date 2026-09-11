// components/ui/Skeleton.tsx
import React from "react";
import { cn } from "@/lib/utils";

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={cn(
      "animate-pulse rounded-xl backdrop-blur-sm",
      "bg-slate-200/90 border border-slate-300/60 shadow-sm",
      "dark:bg-white/[0.08] dark:border-white/10 dark:shadow-none",
      "transition-all duration-300 ease-in-out",
      className
    )}
    {...props}
  />
);

export const CardSkeleton: React.FC<{ count?: number; className?: string }> = ({ count = 3, className }) => (
  <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#141418] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    ))}
  </div>
);

export const TableRowSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full space-y-2.5">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#141418] border border-slate-200/80 dark:border-white/10 shadow-sm gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <Skeleton className="h-4 w-3/4 max-w-[200px]" />
            <Skeleton className="h-3 w-1/2 max-w-[140px]" />
          </div>
        </div>
        <Skeleton className="h-7 w-20 rounded-lg shrink-0" />
      </div>
    ))}
  </div>
);

export const MapCanvasSkeleton: React.FC<{ height?: string }> = ({ height = "h-[470px]" }) => (
  <div className={cn("relative w-full rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-2xl bg-slate-100 dark:bg-[#0B0B0E] flex flex-col items-center justify-center", height)}>
    <div className="absolute top-3 left-3 flex items-center gap-2">
      <Skeleton className="h-6 w-20 rounded-md" />
      <Skeleton className="h-6 w-16 rounded-md" />
    </div>
    <div className="absolute top-3 right-3">
      <Skeleton className="h-6 w-28 rounded-md" />
    </div>
    <div className="relative flex items-center justify-center">
      <div className="w-16 h-16 rounded-full border border-amber-500/30 dark:border-[#FFFC00]/20 animate-ping absolute" />
      <div className="w-10 h-10 rounded-full bg-amber-400/20 dark:bg-[#FFFC00]/20 border border-amber-500/40 dark:border-[#FFFC00]/40 flex items-center justify-center text-base">👻</div>
    </div>
    <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-72">
      <div className="p-3 rounded-xl bg-white dark:bg-[#141418] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-6 w-full rounded-lg" />
      </div>
    </div>
  </div>
);
