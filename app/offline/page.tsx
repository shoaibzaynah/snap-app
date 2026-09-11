// app/offline/page.tsx - Snapchat Native Offline Fallback Shell
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const checkAndRestore = () => {
      if (navigator.onLine) {
        fetch("/api/companion/version", { method: "HEAD", cache: "no-store" })
          .then(() => {
            window.location.href = "/admin";
          })
          .catch(() => {});
      }
    };
    window.addEventListener("online", checkAndRestore);
    const interval = setInterval(checkAndRestore, 1500);
    return () => {
      window.removeEventListener("online", checkAndRestore);
      clearInterval(interval);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.href = "/admin";
      } else {
        setIsRetrying(false);
      }
    }, 800);
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white flex flex-col items-center justify-between p-4 sm:p-6 select-none">
      {/* Top Brand Bar */}
      <div className="w-full max-w-md flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Image src="/LOGO.svg" alt="SNAP APP" width={28} height={28} className="drop-shadow-[0_0_12px_rgba(255,252,0,0.5)]" />
          <span className="font-black text-sm tracking-wider">SNAP APP</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-bold">
          <WifiOff className="w-3 h-3 animate-pulse" />
          <span>Offline Mode</span>
        </div>
      </div>

      {/* Center Native Card */}
      <div className="w-full max-w-md flex flex-col items-center text-center my-auto py-8 space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 dark:bg-[#FFFC00]/10 border border-amber-500/20 dark:border-[#FFFC00]/30 animate-ping absolute" />
          <div className="w-16 h-16 rounded-3xl bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/10 shadow-xl flex items-center justify-center relative">
            <WifiOff className="w-8 h-8 text-amber-500 dark:text-[#FFFC00]" />
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Connection Lost
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 max-w-xs leading-relaxed mx-auto">
            SNAP APP is active in offline shell mode. Your session and device telemetry will resume automatically upon reconnecting.
          </p>
        </div>

        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full max-w-xs h-11 rounded-2xl bg-[#FFFC00] hover:bg-[#ffe600] text-black font-black text-xs sm:text-sm shadow-lg shadow-yellow-500/20 active:scale-95 transition-all gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
          <span>{isRetrying ? "Checking Signal..." : "Retry Connection"}</span>
        </Button>
      </div>

      {/* Bottom Preserved UI Skeleton Silhouette */}
      <div className="w-full max-w-md space-y-2 opacity-60">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 text-center">
          Preserved Dashboard Silhouette
        </p>
        <CardSkeleton count={2} className="grid-cols-2 gap-2.5" />
      </div>
    </main>
  );
}
