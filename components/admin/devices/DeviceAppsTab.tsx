// components/admin/devices/DeviceAppsTab.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DeviceInstalledApp } from "@/lib/device-types";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Clock, Layers, Trash2, Search, RefreshCw, Flame, Smartphone, Cpu } from "lucide-react";

interface Props {
  deviceId: string;
  onDeleteApp?: (id: string) => void;
  onSync?: () => void;
  onBulkDelete?: () => void;
}

type FilterMode = "all" | "user" | "used" | "system";

const getAppGradient = (name: string) => {
  const g = [
    "from-amber-400 to-yellow-600", "from-cyan-400 to-blue-600", "from-emerald-400 to-teal-600",
    "from-purple-400 to-pink-600", "from-rose-400 to-red-600", "from-indigo-400 to-purple-600",
  ];
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return g[Math.abs(h) % g.length];
};

export const DeviceAppsTab: React.FC<Props> = ({ deviceId, onDeleteApp, onSync, onBulkDelete }) => {
  const [apps, setApps] = useState<DeviceInstalledApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("user");

  const fetchApps = async () => {
    try {
      const q = search ? `&q=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/devices/${deviceId}/data?type=apps&limit=500${q}&_t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setApps(json.apps || []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchApps(); }, [deviceId, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return "Not opened today";
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const totalScreenTime = useMemo(() => apps.reduce((acc, a) => acc + (a.usage_time_seconds || 0), 0), [apps]);
  const userApps = useMemo(() => apps.filter((a) => !a.is_system_app), [apps]);
  const usedApps = useMemo(() => apps.filter((a) => (a.usage_time_seconds || 0) > 0), [apps]);
  const maxUsage = useMemo(() => Math.max(...apps.map((a) => a.usage_time_seconds || 0), 1), [apps]);

  const displayedApps = useMemo(() => {
    let list = apps;
    if (filter === "user") list = userApps;
    else if (filter === "used") list = usedApps;
    else if (filter === "system") list = apps.filter((a) => a.is_system_app);
    return [...list].sort((a, b) => (b.usage_time_seconds || 0) - (a.usage_time_seconds || 0));
  }, [apps, filter, userApps, usedApps]);

  const topApp = useMemo(() => usedApps.sort((a, b) => (b.usage_time_seconds || 0) - (a.usage_time_seconds || 0))[0], [usedApps]);

  return (
    <div className="space-y-4">
      {/* Screen Time Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFFC00]/15 flex items-center justify-center text-[#FFFC00] shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-white/50 font-medium">Screen Time Today</p>
            <p className="text-sm font-black text-white">{formatDuration(totalScreenTime)}</p>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-white/50 font-medium">Top Used App</p>
            <p className="text-sm font-black text-white truncate">{topApp ? topApp.app_name : "None yet"}</p>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-white/50 font-medium">User Apps</p>
            <p className="text-sm font-black text-white">{userApps.length}</p>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-white/50 font-medium">Total Inventory</p>
            <p className="text-sm font-black text-white">{apps.length}</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/5 overflow-x-auto max-w-full no-scrollbar">
          {[
            { id: "user", label: "User Apps", count: userApps.length, icon: Smartphone },
            { id: "used", label: "Active Today", count: usedApps.length, icon: Flame },
            { id: "all", label: "All", count: apps.length, icon: Layers },
            { id: "system", label: "System", count: apps.length - userApps.length, icon: Cpu },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FilterMode)}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all shrink-0 ${filter === tab.id ? "bg-[#FFFC00] text-black shadow-md" : "text-white/60 hover:text-white"}`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === tab.id ? "bg-black/20 text-black" : "bg-white/10 text-white/60"}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-52">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <Input placeholder="Search apps..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-8 text-xs bg-white/5 w-full" />
          </div>
          {onSync && (
            <button onClick={onSync} className="h-8 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-1.5 shrink-0">
              <RefreshCw className="w-3.5 h-3.5" /> <span>Sync</span>
            </button>
          )}
          {onBulkDelete && apps.length > 0 && (
            <button onClick={() => { if (confirm("Delete all app records?")) onBulkDelete(); }} className="h-8 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs border border-rose-500/20 transition-all flex items-center gap-1.5 shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* App List Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-white/40 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#FFFC00]" /> Loading app usage telemetry...
        </div>
      ) : displayedApps.length === 0 ? (
        <Card className="p-8 text-center text-white/50 text-xs">No apps match the selected filter.</Card>
      ) : (
        <div className="grid gap-2 max-h-[550px] overflow-y-auto pr-1">
          {displayedApps.map((app) => {
            const usageSec = app.usage_time_seconds || 0;
            const usagePct = Math.min(Math.round((usageSec / maxUsage) * 100), 100);
            return (
              <div key={app.id} className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-all flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAppGradient(app.app_name || "App")} flex items-center justify-center text-white font-black text-sm shadow-md shrink-0 border border-white/15 select-none`}>
                    {(app.app_name || "A").trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{app.app_name}</span>
                      {app.is_system_app && <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/40 font-semibold">System</span>}
                    </div>
                    <span className="text-[10px] font-mono text-white/40 block truncate">{app.package_name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-32 sm:w-44 text-right space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-white/40 text-[10px]">Today</span>
                      <span className={`font-mono font-bold ${usageSec > 0 ? "text-[#FFFC00]" : "text-white/40"}`}>{formatDuration(usageSec)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-yellow-500 to-[#FFFC00] rounded-full transition-all" style={{ width: `${usagePct}%` }} />
                    </div>
                  </div>
                  {onDeleteApp && (
                    <button onClick={() => { if (confirm(`Delete "${app.app_name}"?`)) onDeleteApp(app.id); }} className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/20 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};