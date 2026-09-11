// app/admin/devices/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MonitoredDevice } from "@/lib/device-types";
import { DeviceOverviewCard } from "@/components/admin/devices/DeviceOverviewCard";
import { AddDeviceModal } from "@/components/admin/devices/AddDeviceModal";
import { ApkDownloadModal } from "@/components/admin/devices/ApkDownloadModal";
import { ApkQrModal } from "@/components/admin/devices/ApkQrModal";
import { DeviceMetricsRow } from "@/components/admin/devices/DeviceMetricsRow";
import { PairingGuideTooltip } from "@/components/admin/devices/PairingGuideTooltip";
import { Tooltip } from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";
import { Smartphone, Plus, RefreshCw, Shield, Download, Radio, QrCode } from "lucide-react";

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<MonitoredDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [apkModalOpen, setApkModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

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
      {/* Header: Responsive Mobile & Desktop Layout */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-[#FFFC00]/10 border border-amber-500/20 dark:border-[#FFFC00]/20 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4 text-amber-600 dark:text-[#FFFC00]" />
              </div>
              <h1 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                Kid Devices
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold shrink-0">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span>Live</span>
              </span>
            </div>
            <div className="sm:hidden flex items-center">
              <Button variant="glass" size="sm" onClick={fetchDevices} disabled={loading} className="h-8 w-8 p-0 rounded-full border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70" title="Refresh">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap">
            <Button variant="glass" size="sm" onClick={fetchDevices} disabled={loading} className="hidden sm:flex h-8 sm:h-9 w-8 sm:w-9 p-0 rounded-full border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 shrink-0 items-center justify-center" title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <PairingGuideTooltip />
            <Tooltip content="Silent Android companion APK download." placement="bottom" widthClass="w-60">
              <Button variant="secondary" size="sm" onClick={() => setApkModalOpen(true)} className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-[11px] sm:text-xs font-bold shrink-0">
                <Download className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-[#FFFC00]" />
                <span>APK</span>
              </Button>
            </Tooltip>
            <Tooltip content="Scan QR to download companion on child phone." placement="bottom" widthClass="w-60">
              <Button variant="secondary" size="sm" onClick={() => setQrModalOpen(true)} className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border-slate-200 dark:border-white/10 text-slate-800 dark:text-white text-[11px] sm:text-xs font-bold shrink-0">
                <QrCode className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-[#FFFC00]" />
                <span>QR</span>
              </Button>
            </Tooltip>
            <Button size="sm" onClick={() => setModalOpen(true)} className="h-8 sm:h-9 px-3 sm:px-4 rounded-full shadow-lg shadow-yellow-500/20 font-bold text-[11px] sm:text-xs shrink-0">
              <Plus className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
              <span>Add Device</span>
            </Button>
          </div>
        </div>
        <p className="text-slate-500 dark:text-white/50 text-[11px] sm:text-xs md:text-sm leading-relaxed">
          Realtime multi-device monitoring hub for your children. 24/7 background GPS, contacts, calls, and silent camera snapshots.
        </p>
      </div>

      {/* Metrics Row: Responsive Native Box Style */}
      <DeviceMetricsRow
        totalCount={devices.length}
        onlineCount={onlineCount}
        lowBatteryCount={lowBatteryCount}
      />

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
        onOpenQr={() => {
          setApkModalOpen(false);
          setQrModalOpen(true);
        }}
      />

      {/* Instant QR Code Modal */}
      <ApkQrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />
    </div>
  );
}
