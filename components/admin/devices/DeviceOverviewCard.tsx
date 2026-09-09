// components/admin/devices/DeviceOverviewCard.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MonitoredDevice } from "@/lib/device-types";
import { formatLocalTime } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Smartphone,
  Battery,
  BatteryCharging,
  Clock,
  ChevronRight,
  Trash2,
  Eye,
  MapPin,
} from "lucide-react";

interface Props {
  device: MonitoredDevice;
  onRefresh: () => void;
}

export const DeviceOverviewCard: React.FC<Props> = ({ device, onRefresh }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to remove ${device.child_name}'s device?`)) return;
    try {
      setDeleting(true);
      await fetch(`/api/devices/${device.id}`, { method: "DELETE" });
      onRefresh();
    } finally {
      setDeleting(false);
    }
  };

  const isLowBattery = device.battery_level <= 20;

  return (
    <Card className="p-5 border-white/10 hover:border-[#FFFC00]/40 transition-all group relative overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFFC00]/10 border border-[#FFFC00]/30 flex items-center justify-center text-[#FFFC00] shadow-lg shadow-yellow-500/10">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base leading-tight group-hover:text-[#FFFC00] transition-colors">
              {device.child_name}
            </h3>
            <p className="text-white/40 text-xs mt-0.5 font-mono">
              {device.model || device.device_name || "Android Device"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant={device.is_online ? "active" : "expired"}>
            {device.is_online ? "Online" : "Offline"}
          </Badge>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-all"
            title="Delete Device"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 py-3 px-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
        <div className="flex items-center gap-2">
          {device.is_charging ? (
            <BatteryCharging className="w-4 h-4 text-[#FFFC00]" />
          ) : (
            <Battery className={`w-4 h-4 ${isLowBattery ? "text-red-400" : "text-emerald-400"}`} />
          )}
          <span className="text-white/80 font-semibold">
            {device.battery_level}% {device.is_charging && "(Charging)"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-white/50 justify-end">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {formatLocalTime(device.last_seen_at)}
          </span>
        </div>
      </div>

      {device.latest_location && (
        <div className="flex items-center gap-1.5 text-[11px] text-white/60 mb-4 px-1 truncate">
          <MapPin className="w-3.5 h-3.5 text-[#FFFC00] shrink-0" />
          <span className="truncate">
            {device.latest_location.latitude.toFixed(5)}, {device.latest_location.longitude.toFixed(5)}
          </span>
        </div>
      )}

      <div className="pt-2 border-t border-white/5">
        <Link
          href={`/admin/devices/${device.id}`}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#FFFC00] text-black font-bold text-xs shadow-lg shadow-yellow-500/20 hover:bg-[#ffe500] transition-all active:scale-95"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Open Hub</span>
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Link>
      </div>
    </Card>
  );
};
