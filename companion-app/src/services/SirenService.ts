// companion-app/src/services/SirenService.ts
import { Audio } from "expo-av";
import { NativeModules, Platform } from "react-native";

const { SirenModule } = NativeModules;
let soundInstance: Audio.Sound | null = null;

export async function playEmergencySiren(): Promise<void> {
  try {
    // Maximize stream volume via native Android AudioManager
    if (Platform.OS === "android" && SirenModule?.maximizeVolume) {
      SirenModule.maximizeVolume();
    }

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    });

    if (soundInstance) {
      await soundInstance.stopAsync();
      await soundInstance.unloadAsync();
      soundInstance = null;
    }

    // Play loop siren sound from asset or remote alert tone
    const { sound } = await Audio.Sound.createAsync(
      { uri: "https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3" },
      { shouldPlay: true, isLooping: true, volume: 1.0 }
    );
    soundInstance = sound;

    // Auto-stop after 30 seconds if not cancelled
    setTimeout(() => {
      stopEmergencySiren();
    }, 30000);
  } catch (err) {
    console.error("Error playing emergency siren", err);
  }
}

export async function stopEmergencySiren(): Promise<void> {
  try {
    if (soundInstance) {
      await soundInstance.stopAsync();
      await soundInstance.unloadAsync();
      soundInstance = null;
    }
  } catch (err) {
    console.error("Error stopping siren", err);
  }
}
