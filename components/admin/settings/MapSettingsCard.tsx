// components/admin/settings/MapSettingsCard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MapPin, CheckCircle2, Eye, EyeOff } from "lucide-react";

export const MapSettingsCard: React.FC = () => {
  const [showAccuracy, setShowAccuracy] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("snap_map_accuracy");
    if (saved !== null) setShowAccuracy(saved === "true");
  }, []);

  const toggleAccuracy = () => {
    const next = !showAccuracy;
    setShowAccuracy(next);
    localStorage.setItem("snap_map_accuracy", String(next));
  };

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 flex items-center justify-center text-blue-500 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Map &amp; Retina Tile Engine</h3>
            <p className="text-xs text-slate-500 dark:text-white/50 leading-relaxed">
              High-DPI 512px Retina Carto tiles &bull; Zero blur &bull; Zero watermark
            </p>
          </div>
        </div>
        <div className="self-start sm:self-auto shrink-0">
          <Badge variant="active" className="gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Ultra-Sharp 512px
          </Badge>
        </div>
      </div>

      <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed">
        High-DPI Retina vector tiles are permanently enabled across all locator maps. Text labels, buildings, and streets remain razor-sharp up to zoom level 20.
      </p>

      <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-xs font-semibold text-slate-900 dark:text-white block">GPS Accuracy Circle</span>
          <span className="text-[11px] text-slate-500 dark:text-white/40 leading-tight block">
            Render yellow GPS accuracy radius halo around live locator pin
          </span>
        </div>
        <button
          onClick={toggleAccuracy}
          className={`self-start sm:self-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            showAccuracy
              ? "bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black shadow-sm"
              : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50"
          }`}
        >
          {showAccuracy ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {showAccuracy ? "Enabled" : "Hidden"}
        </button>
      </div>
    </Card>
  );
};
