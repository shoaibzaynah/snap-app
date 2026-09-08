"use client";

// components/admin/InstallPwaBanner.tsx
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Share2, PlusSquare, X } from "lucide-react";

export const InstallPwaBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(true);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already running in standalone PWA mode
    const isStandalone =
      (window.navigator as any).standalone ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (isStandalone) {
      setIsDismissed(true);
      return;
    }

    // Check if previously dismissed
    const dismissed = localStorage.getItem("snap_pwa_banner_dismissed");
    if (!dismissed) {
      setIsDismissed(false);
    }

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua));
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("snap_pwa_banner_dismissed", "true");
  };

  if (isDismissed) return null;

  return (
    <div className="relative p-3.5 bg-white dark:bg-[#141418] border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl flex items-start gap-3 animate-fadeIn text-xs transition-colors">
      <div className="w-10 h-10 rounded-xl bg-[#FFFC00] flex items-center justify-center p-1.5 shrink-0 shadow-lg shadow-yellow-500/20">
        <Image src="/LOGO.svg" alt="App Icon" width={28} height={28} className="object-contain" />
      </div>

      <div className="flex-1 space-y-1 pr-6">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-900 dark:text-white text-sm">Install SNAP APP</span>
          <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-[#FFFC00]/20 text-amber-900 dark:text-[#FFFC00] text-[10px] font-bold">
            Full Screen
          </span>
        </div>
        <p className="text-slate-600 dark:text-white/70 text-[11px] leading-relaxed">
          {isIos ? (
            <>
              Browser bars hatane ke liye: Safari ke neeche{" "}
              <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-[#FFFC00] font-bold">
                <Share2 className="w-3 h-3 inline" /> Share
              </span>{" "}
              dabayein aur{" "}
              <span className="inline-flex items-center gap-0.5 text-amber-700 dark:text-[#FFFC00] font-bold">
                <PlusSquare className="w-3 h-3 inline" /> Add to Home Screen
              </span>{" "}
              karein.
            </>
          ) : (
            "App ki tarah bina browser bars chalane ke liye browser menu se 'Install App' ya 'Add to Home Screen' karein."
          )}
        </p>
      </div>

      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
