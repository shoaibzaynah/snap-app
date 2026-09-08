// app/admin/settings/page.tsx
"use client";

import React from "react";
import { Sliders } from "lucide-react";
import { AppearanceSettingsCard } from "@/components/admin/settings/AppearanceSettingsCard";
import { MapSettingsCard } from "@/components/admin/settings/MapSettingsCard";
import { AlertsSettingsCard } from "@/components/admin/settings/AlertsSettingsCard";
import { SecuritySettingsCard } from "@/components/admin/settings/SecuritySettingsCard";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-amber-600 dark:text-[#FFFC00]" />
          Operations Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-white/50 mt-1">
          Customize dashboard appearance, high-contrast theme, retina map engine, and alert thresholds.
        </p>
      </div>

      <div className="grid gap-4">
        <AppearanceSettingsCard />
        <MapSettingsCard />
        <AlertsSettingsCard />
        <SecuritySettingsCard />
      </div>
    </div>
  );
}
