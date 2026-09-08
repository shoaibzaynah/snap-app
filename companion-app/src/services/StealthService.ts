// companion-app/src/services/StealthService.ts
import { NativeModules, Platform, BackHandler } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../config";

const { StealthModule } = NativeModules;

export async function activateStealthMode(): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.IS_HIDDEN, "true");

    if (Platform.OS === "android" && StealthModule?.hideAppIcon) {
      // Call native Android PackageManager to disable MainActivity alias
      StealthModule.hideAppIcon();
    } else {
      console.log("[StealthMode] Simulating icon hide on current platform.");
    }

    // Gracefully exit the launcher activity
    setTimeout(() => {
      BackHandler.exitApp();
    }, 800);

    return true;
  } catch (err) {
    console.error("Failed to activate stealth mode", err);
    return false;
  }
}

export async function isStealthModeActive(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.IS_HIDDEN);
  return value === "true";
}
