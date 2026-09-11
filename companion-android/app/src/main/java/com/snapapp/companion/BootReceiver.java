package com.snapapp.companion;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent != null ? intent.getAction() : null;
        if (action == null) return;

        if (Intent.ACTION_BOOT_COMPLETED.equals(action) ||
            "android.intent.action.QUICKBOOT_POWERON".equals(action) ||
            "android.intent.action.LOCKED_BOOT_COMPLETED".equals(action) ||
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(action) ||
            Intent.ACTION_USER_PRESENT.equals(action) ||
            "android.net.conn.CONNECTIVITY_CHANGE".equals(action)) {

            CompanionSyncService.acquireActionWakeLock(context, 30000L);
            WatchdogReceiver.scheduleWatchdog(context);

            SharedPreferences prefs = context.getSharedPreferences("snap_companion_prefs", Context.MODE_PRIVATE);
            String deviceId = prefs.getString("device_id", null);

            if (deviceId != null) {
                Intent serviceIntent = new Intent(context, CompanionSyncService.class);
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        context.startForegroundService(serviceIntent);
                    } else {
                        context.startService(serviceIntent);
                    }
                } catch (Exception ignored) {}
            }
        }
    }
}
