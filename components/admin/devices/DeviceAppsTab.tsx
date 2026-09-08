// components/admin/devices/DeviceAppsTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import { DeviceInstalledApp } from "@/lib/device-types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Smartphone, Clock, Search, Layers } from "lucide-react";

interface Props {
  deviceId: string;
}

export const DeviceAppsTab: React.FC<Props> = ({ deviceId }) => {
  const [apps, setApps] = useState<DeviceInstalledApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchApps = async () => {
    try {
      const q = search ? `&q=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/devices/${deviceId}/data?type=apps${q}`);
      if (res.ok) {
        const json = await res.json();
        setApps(json.apps || []);
      }
    } catch (err) {
      console.error("Failed to fetch apps:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, search]);

  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return "Not opened today";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const maxUsage = Math.max(...apps.map((a) => a.usage_time_seconds || 0), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-600 dark:text-[#FFFC00]" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Installed Apps &amp; Screen Time ({apps.length})
          </h3>
        </div>
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search installed apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 dark:text-white/50 text-xs">
          No apps reported yet. Apps inventory will sync on child device connection.
        </Card>
      ) : (
        <div className="grid gap-2.5">
          {apps.map((app) => {
            const usagePercent = Math.min(Math.round(((app.usage_time_seconds || 0) / maxUsage) * 100), 100);
            return (
              <Card key={app.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-lg shrink-0">
                    📱
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {app.app_name}
                      </span>
                      {app.is_system_app && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60">
                          System
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-white/40 block truncate">
                      {app.package_name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:w-64 shrink-0 justify-between sm:justify-end">
                  <div className="w-full max-w-[140px] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-white/50 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600 dark:text-[#FFFC00]" />
                        Usage
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatDuration(app.usage_time_seconds || 0)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 dark:bg-[#FFFC00] rounded-full transition-all"
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
