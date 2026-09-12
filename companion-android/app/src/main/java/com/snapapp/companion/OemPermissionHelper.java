package com.snapapp.companion;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.widget.Toast;

public class OemPermissionHelper {

    public static boolean isAutoStartConfigured(Context context) {
        if (context == null) return false;
        try {
            SharedPreferences prefs = context.getSharedPreferences("snap_companion_prefs", Context.MODE_PRIVATE);
            return prefs.getBoolean("is_autostart_configured", false);
        } catch (Throwable ignored) {
            return false;
        }
    }

    public static void setAutoStartConfigured(Context context, boolean configured) {
        if (context == null) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences("snap_companion_prefs", Context.MODE_PRIVATE);
            prefs.edit().putBoolean("is_autostart_configured", configured).apply();
        } catch (Throwable ignored) {}
    }

    public static void openAutoStartSettings(Context context) {
        if (context == null) return;
        setAutoStartConfigured(context, true);
        String manufacturer = Build.MANUFACTURER.toLowerCase();

        if (manufacturer.contains("huawei") || manufacturer.contains("honor")) {
            String[][] huaweiTargets = new String[][]{
                {"com.huawei.systemmanager", "com.huawei.systemmanager.optimize.process.ProtectActivity"},
                {"com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"},
                {"com.huawei.systemmanager", "com.huawei.systemmanager.appcontrol.activity.StartupAppControlActivity"},
                {"com.huawei.systemmanager", "com.huawei.systemmanager.power.ui.HwPowerManagerActivity"},
                {"com.huawei.systemmanager", "com.huawei.systemmanager.control.AccessControlActivity"},
                {"com.huawei.systemmanager", "com.huawei.systemmanager.mainscreen.MainScreenActivity"},
            };

            for (String[] target : huaweiTargets) {
                try {
                    Intent intent = new Intent();
                    intent.setComponent(new ComponentName(target[0], target[1]));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                    Toast.makeText(context, "Huawei: Protect Snap Safety in Protected Apps / App Launch", Toast.LENGTH_LONG).show();
                    return;
                } catch (Throwable ignored) {}
            }

            try {
                Intent pmIntent = context.getPackageManager().getLaunchIntentForPackage("com.huawei.systemmanager");
                if (pmIntent != null) {
                    pmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(pmIntent);
                    Toast.makeText(context, "Phone Manager: Protect Snap Safety under Battery / App Launch", Toast.LENGTH_LONG).show();
                    return;
                }
            } catch (Throwable ignored) {}
        } else if (manufacturer.contains("xiaomi") || manufacturer.contains("redmi")) {
            try {
                Intent intent = new Intent();
                intent.setComponent(new ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                Toast.makeText(context, "Xiaomi: Enable 'Autostart' for Snap Safety", Toast.LENGTH_LONG).show();
                return;
            } catch (Throwable ignored) {}
        } else if (manufacturer.contains("samsung")) {
            try {
                Intent intent = new Intent();
                intent.setComponent(new ComponentName("com.samsung.android.lool", "com.samsung.android.sm.battery.ui.BatteryActivity"));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                Toast.makeText(context, "Samsung: Set Battery to 'Unrestricted'", Toast.LENGTH_LONG).show();
                return;
            } catch (Throwable ignored) {}
        } else if (manufacturer.contains("oppo")) {
            try {
                Intent intent = new Intent();
                intent.setComponent(new ComponentName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                return;
            } catch (Throwable ignored) {}
        } else if (manufacturer.contains("vivo")) {
            try {
                Intent intent = new Intent();
                intent.setComponent(new ComponentName("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                return;
            } catch (Throwable ignored) {}
        } else if (manufacturer.contains("tecno") || manufacturer.contains("infinix") || manufacturer.contains("transsion") || manufacturer.contains("itel")) {
            try {
                Intent intent = new Intent();
                intent.setComponent(new ComponentName("com.transsion.phonemaster", "com.transsion.phonemaster.permission.startup.StartupAppListActivity"));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                Toast.makeText(context, "Tecno: Enable Auto-start and allow Background Running", Toast.LENGTH_LONG).show();
                return;
            } catch (Throwable ignored) {}
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent optIntent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                optIntent.setData(Uri.parse("package:" + context.getPackageName()));
                optIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(optIntent);
            }
        } catch (Throwable t) {
            try {
                Intent appSettings = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                appSettings.setData(Uri.parse("package:" + context.getPackageName()));
                appSettings.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(appSettings);
            } catch (Throwable ignored2) {}
        }
    }
}
