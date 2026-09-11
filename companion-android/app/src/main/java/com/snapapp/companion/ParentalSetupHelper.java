package com.snapapp.companion;

import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

public class ParentalSetupHelper {

    public static boolean isDeviceAdminActive(Context ctx) {
        if (ctx == null) return false;
        try {
            DevicePolicyManager dpm = (DevicePolicyManager) ctx.getSystemService(Context.DEVICE_POLICY_SERVICE);
            ComponentName adminComponent = new ComponentName(ctx, SnapDeviceAdminReceiver.class);
            return dpm != null && dpm.isAdminActive(adminComponent);
        } catch (Throwable ignored) {
            return false;
        }
    }

    public static void promptDeviceAdmin(Activity act) {
        if (act == null || isDeviceAdminActive(act)) return;
        try {
            ComponentName adminComponent = new ComponentName(act, SnapDeviceAdminReceiver.class);
            Intent intent = new Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN);
            intent.putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent);
            intent.putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Activate Snap Safety Device Administrator to prevent unauthorized uninstallation.");
            act.startActivity(intent);
        } catch (Throwable ignored) {}
    }

    public static void promptAccessibility(Context ctx) {
        if (ctx == null) return;
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        } catch (Throwable ignored) {}
    }

    public static void promptNotificationAccess(Context ctx) {
        if (ctx == null) return;
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(intent);
        } catch (Throwable ignored) {}
    }

    public static void promptBatteryOptimization(Context ctx) {
        if (ctx == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
        try {
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(ctx.getPackageName())) {
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(android.net.Uri.parse("package:" + ctx.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(intent);
            }
        } catch (Throwable ignored) {}
    }
}
