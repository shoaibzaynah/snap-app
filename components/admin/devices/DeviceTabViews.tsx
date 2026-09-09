// components/admin/devices/DeviceTabViews.tsx
"use client";

import React from "react";
import { MonitoredDevice, DeviceLocation, DeviceContact, DeviceCall, DeviceMessage, DeviceFileItem } from "@/lib/device-types";
import { DeviceMapTracker } from "@/components/admin/devices/DeviceMapTracker";
import { DeviceCameraGallery } from "@/components/admin/devices/DeviceCameraGallery";
import { DeviceAudioGallery, AudioCapture } from "@/components/admin/devices/DeviceAudioGallery";
import { DeviceContactsTable } from "@/components/admin/devices/DeviceContactsTable";
import { DeviceCallLogsList } from "@/components/admin/devices/DeviceCallLogsList";
import { DeviceMessagesFeed } from "@/components/admin/devices/DeviceMessagesFeed";
import { DeviceAppsTab } from "@/components/admin/devices/DeviceAppsTab";
import { DeviceLiveStreamPanel } from "@/components/admin/devices/DeviceLiveStreamPanel";
import { DeviceGalleryTab } from "@/components/admin/devices/DeviceGalleryTab";

interface Props {
  activeTab: string;
  device: MonitoredDevice;
  locations: DeviceLocation[];
  contacts: DeviceContact[];
  calls: DeviceCall[];
  messages: DeviceMessage[];
  captures: any[];
  audioClips: AudioCapture[];
  files: DeviceFileItem[];
  filesLoading?: boolean;
  isLiveMovement?: boolean;
  onToggleLiveMovement?: (active: boolean) => void;
  onSendCommand: (cmd: string, payload?: any, label?: string) => void;
  onDeleteCommand: (id: string) => void;
}

export const DeviceTabViews: React.FC<Props> = ({
  activeTab,
  device,
  locations,
  contacts,
  calls,
  messages,
  captures,
  audioClips,
  files,
  filesLoading,
  isLiveMovement,
  onToggleLiveMovement,
  onSendCommand,
  onDeleteCommand,
}) => {
  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-[#0B0B0E] border border-slate-200 dark:border-white/10 shadow-xl">
      {activeTab === "map" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => onSendCommand("fetch_location", {}, "Location fetch request")}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              🔄 Fetch Fresh Location
            </button>
          </div>
          <DeviceMapTracker
            locations={locations}
            childName={device.child_name}
            isLiveMovement={isLiveMovement}
            onToggleLiveMovement={onToggleLiveMovement}
          />
        </div>
      )}
      {activeTab === "camera" && (
        <DeviceCameraGallery
          captures={captures}
          onTriggerSnap={(cam) => onSendCommand("take_photo", { camera: cam }, `${cam} snap`)}
          onDeleteSnap={onDeleteCommand}
        />
      )}
      {activeTab === "audio" && (
        <DeviceAudioGallery
          audioClips={audioClips}
          onTriggerAudio={(dur) => onSendCommand("record_audio", { duration: dur }, `${dur}s audio recording`)}
          onDeleteAudio={onDeleteCommand}
        />
      )}
      {activeTab === "apps" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => onSendCommand("sync_apps", {}, "Apps sync")}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              🔄 Sync Apps
            </button>
          </div>
          <DeviceAppsTab deviceId={device.id} />
        </div>
      )}
      {activeTab === "contacts" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => onSendCommand("sync_contacts", {}, "Contacts sync")}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              🔄 Sync Contacts
            </button>
          </div>
          <DeviceContactsTable contacts={contacts} />
        </div>
      )}
      {activeTab === "calls" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => onSendCommand("sync_calls", {}, "Calls sync")}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              🔄 Sync Calls
            </button>
          </div>
          <DeviceCallLogsList calls={calls} />
        </div>
      )}
      {activeTab === "messages" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={() => onSendCommand("sync_messages", {}, "SMS sync")}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              🔄 Sync SMS
            </button>
          </div>
          <DeviceMessagesFeed messages={messages} />
        </div>
      )}
      {activeTab === "stream" && (
        <DeviceLiveStreamPanel
          deviceId={device.id}
          childName={device.child_name}
          isOnline={device.is_online}
          onSendCommand={onSendCommand}
        />
      )}
      {activeTab === "gallery" && (
        <DeviceGalleryTab
          files={files}
          loading={filesLoading}
          onSyncGallery={() => onSendCommand("sync_gallery", {}, "Sync Gallery")}
        />
      )}
    </div>
  );
};
