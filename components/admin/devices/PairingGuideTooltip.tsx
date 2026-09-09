// components/admin/devices/PairingGuideTooltip.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { HelpCircle, Sparkles } from "lucide-react";

export const PairingGuideTooltip: React.FC = () => {
  const [displayUrl, setDisplayUrl] = useState("localhost:3000/admin/devices");

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Exact address bar detection: local shows local, domain shows domain!
      setDisplayUrl(`${window.location.host}/admin/devices`);
    }
  }, []);

  const guideContent = (
    <div className="space-y-2.5 text-xs text-slate-800 dark:text-white/90">
      <div className="flex items-start gap-2.5">
        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:bg-[#FFFC00] dark:text-black font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          1
        </span>
        <p className="leading-relaxed">
          Go to your Admin Dashboard and click <strong>&quot;Register Device&quot;</strong>.
        </p>
      </div>

      <div className="flex items-start gap-2.5">
        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:bg-[#FFFC00] dark:text-black font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          2
        </span>
        <p className="leading-relaxed">
          Enter child&apos;s name (e.g. &quot;Ali&quot;) to generate a 6-digit <strong>Pairing Code</strong> (e.g. <span className="font-mono text-amber-700 dark:text-[#FFFC00] font-bold">9YMQES</span>).
        </p>
      </div>

      <div className="flex items-start gap-2.5">
        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:bg-[#FFFC00] dark:text-black font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          3
        </span>
        <p className="leading-relaxed">
          Open the Companion APK on the child&apos;s phone and enter the <strong>Pairing Code</strong>.
        </p>
      </div>

      <div className="flex items-start gap-2.5">
        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:bg-[#FFFC00] dark:text-black font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          4
        </span>
        <p className="leading-relaxed">
          Grant Android permissions (Location: <em>Allow all the time</em>, Contacts, Calls, SMS, Usage Stats).
        </p>
      </div>

      <div className="flex items-start gap-2.5">
        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:bg-[#FFFC00] dark:text-black font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          5
        </span>
        <p className="leading-relaxed">
          The app will verify, <strong>auto-hide its icon</strong> into stealth mode, and start the silent background service!
        </p>
      </div>
    </div>
  );

  return (
    <Tooltip
      title="Pairing Guide (1 Minute Setup):"
      content={guideContent}
      placement="bottom-left"
      widthClass="w-[calc(100vw-2rem)] max-w-sm sm:w-96"
    >
      <div className="h-7 sm:h-8 md:h-9 px-2 sm:px-3 md:px-3.5 rounded-full bg-amber-500/10 dark:bg-[#FFFC00]/10 hover:bg-amber-500/20 dark:hover:bg-[#FFFC00]/20 border border-amber-500/30 dark:border-[#FFFC00]/30 text-amber-700 dark:text-[#FFFC00] text-[10px] sm:text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1 sm:gap-1.5 shrink-0 select-none cursor-pointer">
        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
        <span className="sm:hidden">Guide</span>
        <span className="hidden sm:inline whitespace-nowrap">Pairing Guide</span>
      </div>
    </Tooltip>
  );
};
