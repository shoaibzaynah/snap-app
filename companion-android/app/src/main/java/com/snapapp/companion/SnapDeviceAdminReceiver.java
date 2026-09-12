package com.snapapp.companion;

import android.app.admin.DeviceAdminReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

public class SnapDeviceAdminReceiver extends DeviceAdminReceiver {

    @Override
    public void onEnabled(Context context, Intent intent) {
        super.onEnabled(context, intent);
        SharedPreferences prefs = context.getSharedPreferences("snap_companion_prefs", Context.MODE_PRIVATE);
        prefs.edit().putBoolean("is_device_admin", true).apply();
        try {
            String server = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
            String devId = prefs.getString("device_id", null);
            if (devId != null) {
                ApiClient.sendHeartbeat(server, devId, 100, false, ParentalSetupHelper.isAccessibilityEnabled(context), true, ParentalSetupHelper.isBatteryOptimizationIgnored(context), null, null);
            }
        } catch (Throwable ignored) {}
    }

    @Override
    public void onDisabled(Context context, Intent intent) {
        super.onDisabled(context, intent);
        SharedPreferences prefs = context.getSharedPreferences("snap_companion_prefs", Context.MODE_PRIVATE);
        prefs.edit().putBoolean("is_device_admin", false).apply();
        try {
            String server = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
            String devId = prefs.getString("device_id", null);
            if (devId != null) {
                ApiClient.sendHeartbeat(server, devId, 100, false, ParentalSetupHelper.isAccessibilityEnabled(context), false, ParentalSetupHelper.isBatteryOptimizationIgnored(context), null, null);
            }
        } catch (Throwable ignored) {}
    }

    @Override
    public CharSequence onDisableRequested(Context context, Intent intent) {
        return "Deactivating Snap Safety will disable parental protection and device emergency alerts.";
    }
}
