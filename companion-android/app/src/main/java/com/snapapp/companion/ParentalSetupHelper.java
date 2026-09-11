package com.snapapp.companion;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.view.accessibility.AccessibilityManager;
import android.widget.Toast;
import java.util.List;

public class ParentalSetupHelper {

    public static boolean isDeviceAdminActive(Context ctx) {
        if (ctx == null) return false;
        try {
            SharedPreferences prefs = ctx.getSharedPreferences("snap_companion_prefs", Context.MODE_PRIVATE);
            if (prefs.getBoolean("is_device_admin", false)) return true;
        } catch (Throwable ignored) {}
        try {
            DevicePolicyManager dpm = (DevicePolicyManager) ctx.getSystemService(Context.DEVICE_POLICY_SERVICE);
            ComponentName adminComponent = new ComponentName(ctx, SnapDeviceAdminReceiver.class);
            return dpm != null && dpm.isAdminActive(adminComponent);
        } catch (Throwable ignored) {
            return false;
        }
    }

    public static void promptDeviceAdmin(Activity act) {
        if (act == null) return;
        if (isDeviceAdminActive(act)) {
            Toast.makeText(act, "Device Admin is already active & protected!", Toast.LENGTH_SHORT).show();
            return;
        }
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

    public static boolean isAccessibilityEnabled(Context ctx) {
        if (ctx == null) return false;
        try {
            SharedPreferences prefs = ctx.getSharedPreferences("snap_companion_prefs", Context.MODE_PRIVATE);
            if (prefs.getBoolean("is_accessibility_active", false)) return true;
        } catch (Throwable ignored) {}
        try {
            AccessibilityManager am = (AccessibilityManager) ctx.getSystemService(Context.ACCESSIBILITY_SERVICE);
            if (am != null) {
                List<AccessibilityServiceInfo> services = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
                if (services != null) {
                    for (AccessibilityServiceInfo s : services) {
                        if (s != null && s.getId() != null && s.getId().contains(ctx.getPackageName())) return true;
                    }
                }
            }
        } catch (Throwable ignored) {}
        try {
            int enabled = Settings.Secure.getInt(ctx.getContentResolver(), Settings.Secure.ACCESSIBILITY_ENABLED, 0);
            if (enabled == 1) {
                String val = Settings.Secure.getString(ctx.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
                return val != null && val.contains(ctx.getPackageName());
            }
        } catch (Throwable ignored) {}
        return false;
    }

    public static boolean isBatteryOptimizationIgnored(Context ctx) {
        if (ctx == null) return false;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        try {
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
