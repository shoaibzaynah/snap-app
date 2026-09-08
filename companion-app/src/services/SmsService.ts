// companion-app/src/services/SmsService.ts
import { NativeModules, Platform } from "react-native";

const { SmsModule } = NativeModules;

export interface DeviceSmsItem {
  sender: string;
  recipient?: string;
  body: string;
  message_type: string;
  timestamp: string;
}

export async function fetchRecentMessages(): Promise<DeviceSmsItem[]> {
  if (Platform.OS !== "android") {
    return [];
  }

  try {
    if (SmsModule?.getMessages) {
      const messages = await SmsModule.getMessages(50);
      return messages || [];
    }
    return [];
  } catch (err) {
    console.error("Error fetching SMS messages", err);
    return [];
  }
}
