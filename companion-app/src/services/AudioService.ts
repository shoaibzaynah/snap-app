// companion-app/src/services/AudioService.ts
import { NativeModules, Platform } from "react-native";
import { uploadAudio } from "./api";

const { AudioModule } = NativeModules;

export async function recordAudio(
  deviceId: string,
  durationSeconds: number = 15,
  commandId?: string
): Promise<boolean> {
  try {
    if (Platform.OS === "android" && AudioModule?.startRecording) {
      const result = await AudioModule.startRecording(durationSeconds);
      if (result?.file_path) {
        await uploadAudio(deviceId, result.file_path, commandId, durationSeconds);
        return true;
      }
    } else {
      console.log(`[AudioService] Simulated ${durationSeconds}s audio recording`);
    }
    return false;
  } catch (err) {
    console.error("Failed to record audio", err);
    return false;
  }
}