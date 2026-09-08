// companion-app/src/services/CallsService.ts
import { NativeModules, Platform } from "react-native";

const { CallLogModule } = NativeModules;

export interface DeviceCallItem {
  contact_name?: string;
  phone_number: string;
  call_type: string;
  duration_seconds: number;
  timestamp: string;
}

export async function fetchRecentCalls(): Promise<DeviceCallItem[]> {
  if (Platform.OS !== "android") {
    // Return sample/empty if testing outside Android
    return [];
  }

  try {
    if (CallLogModule?.getCallLogs) {
      const logs = await CallLogModule.getCallLogs(50);
      return logs || [];
    }
    return [];
  } catch (err) {
    console.error("Error fetching call logs", err);
    return [];
  }
}
