// components/admin/devices/DeviceNotificationsTab.tsx
"use client";

import React, { useState } from "react";
import { DeviceNotification } from "@/lib/device-telemetry-types";
import { Bell, Trash2, MessageSquare, Send, Instagram, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  notifications: DeviceNotification[];
  onClearAll?: () => void;
  loading?: boolean;
}

function getAppBadge(pkg: string) {
  if (pkg.includes("whatsapp")) return { name: "WhatsApp", color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30", icon: MessageSquare };
  if (pkg.includes("instagram")) return { name: "Instagram", color: "bg-fuchsia-500/15 text-fuchsia-500 border-fuchsia-500/30", icon: Instagram };
  if (pkg.includes("snapchat")) return { name: "Snapchat", color: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30", icon: Send };
  if (pkg.includes("messaging") || pkg.includes("sms")) return { name: "SMS", color: "bg-blue-500/15 text-blue-500 border-blue-500/30", icon: MessageSquare };
  return { name: "App", color: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30", icon: Smartphone };
}

export const DeviceNotificationsTab: React.FC<Props> = ({ notifications, onClearAll, loading }) => {
  const [search, setSearch] = useState("");

  const filtered = notifications.filter(
    (n) =>
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.text?.toLowerCase().includes(search.toLowerCase()) ||
      n.app_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          placeholder="Filter notifications by sender or text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-amber-500"
        />
        {notifications.length > 0 && onClearAll && (
          <Button size="sm" variant="secondary" onClick={onClearAll} className="h-8 text-xs text-rose-500 gap-1 shrink-0">
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </Button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center space-y-2">
          <Bell className="w-8 h-8 text-slate-400 dark:text-white/30 mx-auto" />
          <p className="text-xs font-bold text-slate-700 dark:text-white/70">No Notifications Logged</p>
          <p className="text-[11px] text-slate-400 dark:text-white/40 max-w-sm mx-auto">
            Enable Notifications in Telemetry Controls to capture incoming WhatsApp, Instagram, Telegram &amp; SMS alerts.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const badge = getAppBadge(n.package_name || "");
            const Icon = badge.icon;
            return (
              <div
                key={n.id}
                className="bg-white dark:bg-white/[0.03] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono ${badge.color}`}>
                    <Icon className="w-3 h-3" />
                    {n.app_name || badge.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-white/40">
                    {new Date(n.post_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {n.title && <p className="font-bold text-slate-900 dark:text-white text-xs pt-0.5">{n.title}</p>}
                {n.text && <p className="text-slate-600 dark:text-white/70 text-xs leading-relaxed">{n.text}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
