// companion-app/src/services/AppsService.ts
import { NativeModules, Platform } from "react-native";

const { AppUsageModule } = NativeModules;

export interface AppInfo {
  package_name: string;
  app_name: string;
  usage_time_seconds: number;
  last_time_used: number | null;
  is_system_app: boolean;
}

export async function fetchInstalledApps(): Promise<AppInfo[]> {
  try {
    if (Platform.OS === "android" && AppUsageModule?.getInstalledAppsAndUsage) {
      const jsonString = await AppUsageModule.getInstalledAppsAndUsage();
      const apps = JSON.parse(jsonString);
      return apps.map((app: any) => ({
        package_name: app.package_name,
        app_name: app.app_name,
        usage_time_seconds: app.usage_time_seconds || 0,
        last_time_used: app.last_time_used,
        is_system_app: app.is_system_app || false,
      }));
    }
    return [];
  } catch (err) {
    console.error("Error fetching installed apps", err);
    return [];
  }
}