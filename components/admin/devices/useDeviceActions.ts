// components/admin/devices/useDeviceActions.ts
"use client";

import { Dispatch, SetStateAction } from "react";
import { DeviceContact, DeviceCall, DeviceMessage, DeviceFileItem } from "@/lib/device-types";

interface ActionProps {
  deviceId: string;
  showToast: (msg: string) => void;
  tabCache: Map<string, { data: any; time: number }>;
  fetchLightStatus: () => void;
  captures: any[];
  audioClips: any[];
  files: DeviceFileItem[];
  setCaptures: Dispatch<SetStateAction<any[]>>;
  setAudioClips: Dispatch<SetStateAction<any[]>>;
  setContacts: Dispatch<SetStateAction<DeviceContact[]>>;
  setCalls: Dispatch<SetStateAction<DeviceCall[]>>;
  setMessages: Dispatch<SetStateAction<DeviceMessage[]>>;
  setFiles: Dispatch<SetStateAction<DeviceFileItem[]>>;
}

export function useDeviceActions({
  deviceId, showToast, tabCache, fetchLightStatus,
  captures, audioClips, files, setCaptures, setAudioClips,
  setContacts, setCalls, setMessages, setFiles,
}: ActionProps) {
  const deleteItem = async (entity: string, paramKey: string, id: string, label: string, filterState?: (id: string) => void) => {
    await fetch(`/api/devices/${deviceId}/data/${entity}?${paramKey}=${id}`, { method: "DELETE" });
    showToast(`${label} deleted!`);
    if (filterState) filterState(id);
    tabCache.clear();
  };

  const bulkDelete = async (entity: string, label: string, clearState?: () => void) => {
    await fetch(`/api/devices/${deviceId}/data/${entity}`, { method: "DELETE" });
    showToast(`All ${label} deleted!`);
    if (clearState) clearState();
    tabCache.clear();
  };

  const handleDeleteCommand = (id: string) => {
    fetch(`/api/devices/${deviceId}/commands?command_id=${id}`, { method: "DELETE" });
    showToast("Item deleted!");
    fetchLightStatus();
  };

  const handleBulkDeleteCommands = (type: "take_photo" | "record_audio") => {
    const items = type === "take_photo" ? captures : audioClips;
    Promise.all(items.map((c: any) =>
      fetch(`/api/devices/${deviceId}/commands?command_id=${c.id}`, { method: "DELETE" })
    )).then(() => {
      showToast(`All ${type === "take_photo" ? "snaps" : "audio"} deleted`);
      if (type === "take_photo") setCaptures([]);
      else setAudioClips([]);
      fetchLightStatus();
    });
  };

  const handleDeleteFile = async (id: string) => {
    const file = files.find(f => f.id === id);
    const query = file?.storage_path
      ? `file_id=${id}&storage_path=${encodeURIComponent(file.storage_path)}`
      : `file_id=${id}`;
    await fetch(`/api/devices/${deviceId}/data/files?${query}`, { method: "DELETE" });
    showToast("File deleted");
    setFiles(p => p.filter(f => f.id !== id));
    tabCache.clear();
  };

  return {
    handleDeleteCommand,
    handleBulkDeleteCommands,
    handleDeleteContact: (id: string) => deleteItem("contacts", "contact_id", id, "Contact", (cid) => setContacts(p => p.filter(c => c.id !== cid))),
    handleDeleteCall: (id: string) => deleteItem("calls", "call_id", id, "Call log", (cid) => setCalls(p => p.filter(c => c.id !== cid))),
    handleDeleteMessage: (id: string) => deleteItem("messages", "message_id", id, "Message", (mid) => setMessages(p => p.filter(m => m.id !== mid))),
    handleDeleteApp: (id: string) => deleteItem("apps", "app_id", id, "App record"),
    handleDeleteFile,
    handleBulkDeleteContacts: () => bulkDelete("contacts", "contacts", () => setContacts([])),
    handleBulkDeleteCalls: () => bulkDelete("calls", "call logs", () => setCalls([])),
    handleBulkDeleteMessages: () => bulkDelete("messages", "messages", () => setMessages([])),
    handleBulkDeleteApps: () => bulkDelete("apps", "app records"),
    handleBulkDeleteFiles: () => bulkDelete("files", "gallery files", () => setFiles([])),
  };
}
