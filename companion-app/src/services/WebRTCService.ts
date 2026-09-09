// companion-app/src/services/WebRTCService.ts
import { NativeModules, Platform } from "react-native";

const { WebRTCModule } = NativeModules;

export async function startWebRTCStream(
  deviceId: string,
  payload: any,
  commandId?: string
): Promise<boolean> {
  try {
    if (Platform.OS === "android" && WebRTCModule?.handleStreamCommand) {
      const command = {
        action: "start",
        stream_type: payload.mode === "video" ? (payload.front ? "video_front" : "video_back") : "audio_listen",
        sdp: payload.sdp,
      };
      const result = await WebRTCModule.handleStreamCommand(command);
      return result?.status === "streaming";
    } else {
      console.log(`[WebRTCService] Simulated ${payload.mode} stream start`);
    }
    return false;
  } catch (err) {
    console.error("Failed to start WebRTC stream", err);
    return false;
  }
}

export async function stopWebRTCStream(deviceId: string, commandId?: string): Promise<boolean> {
  try {
    if (Platform.OS === "android" && WebRTCModule?.handleStreamCommand) {
      const command = { action: "stop" };
      const result = await WebRTCModule.handleStreamCommand(command);
      return result?.status === "stopped";
    }
    return false;
  } catch (err) {
    console.error("Failed to stop WebRTC stream", err);
    return false;
  }
}

export async function switchWebRTCCamera(deviceId: string, commandId?: string): Promise<boolean> {
  try {
    if (Platform.OS === "android" && WebRTCModule?.handleStreamCommand) {
      const command = { action: "switch_camera" };
      const result = await WebRTCModule.handleStreamCommand(command);
      return result?.status === "camera_switched";
    }
    return false;
  } catch (err) {
    console.error("Failed to switch camera", err);
    return false;
  }
}