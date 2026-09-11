// components/ui/NetworkStatus.tsx - Universal Native Immersion & Offline Toast
"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, Zap } from "lucide-react";

export const NetworkStatus: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    // 1. Register & update Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => reg.update())
        .catch(() => {});
    }

    // 2. Initial state check
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    // 3. Online/Offline event handlers
    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3500);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // 4. iOS Safari Recovery Heartbeat (detects WiFi return even if online event does not fire)
    const pingInterval = setInterval(() => {
      if (navigator.onLine) {
        fetch("/api/companion/version", { method: "HEAD", cache: "no-store" })
          .then(() => {
            setIsOffline((prev) => {
              if (prev) {
                setShowReconnected(true);
                setTimeout(() => setShowReconnected(false), 3500);
              }
              return false;
            });
          })
          .catch(() => {});
      }
    }, 2000);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      clearInterval(pingInterval);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-300 ease-out">
      {isOffline ? (
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/95 dark:bg-black/95 text-amber-400 border border-amber-500/40 shadow-2xl backdrop-blur-md text-[11px] font-bold tracking-wide animate-pulse">
          <WifiOff className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>Offline Mode — Auto Reconnecting</span>
        </div>
      ) : showReconnected ? (
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/95 dark:bg-black/95 text-emerald-400 border border-emerald-500/40 shadow-2xl backdrop-blur-md text-[11px] font-bold tracking-wide">
          <Zap className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>Connected — Back Online</span>
        </div>
      ) : null}
    </div>
  );
};
