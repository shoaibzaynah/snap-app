package com.snapapp.companion;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.widget.Toast;

public class OemPermissionHelper {
    public static void openAutoStartSettings(Context context) {
        String manufacturer = Build.MANUFACTURER.toLowerCase();
        Intent intent = new Intent();

        try {
            if (manufacturer.contains("huawei") || manufacturer.contains("honor")) {
                intent.setComponent(new ComponentName("com.huawei.systemmanager",
                        "com.huawei.systemmanager.appcontrol.activity.StartupAppControlActivity"));
                context.startActivity(intent);
                Toast.makeText(context, "Huawei: Set App Launch to 'Manage Manually' (Check all 3)", Toast.LENGTH_LONG).show();
                return;
            } else if (manufacturer.contains("xiaomi") || manufacturer.contains("redmi")) {
                intent.setComponent(new ComponentName("com.miui.securitycenter",
                        "com.miui.permcenter.autostart.AutoStartManagementActivity"));
                context.startActivity(intent);
                Toast.makeText(context, "Xiaomi: Enable 'Autostart' for Snap Safety", Toast.LENGTH_LONG).show();
                return;
            } else if (manufacturer.contains("samsung")) {
                intent.setComponent(new ComponentName("com.samsung.android.lool",
                        "com.samsung.android.sm.battery.ui.BatteryActivity"));
                context.startActivity(intent);
                Toast.makeText(context, "Samsung: Set Battery to 'Unrestricted'", Toast.LENGTH_LONG).show();
                return;
            } else if (manufacturer.contains("oppo")) {
                intent.setComponent(new ComponentName("com.coloros.safecenter",
                        "com.coloros.safecenter.permission.startup.StartupAppListActivity"));
                context.startActivity(intent);
                return;
            } else if (manufacturer.contains("vivo")) {
                intent.setComponent(new ComponentName("com.vivo.permissionmanager",
                        "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"));
                context.startActivity(intent);
                return;
            } else if (manufacturer.contains("tecno") || manufacturer.contains("infinix") || manufacturer.contains("transsion") || manufacturer.contains("itel")) {
                try {
                    intent.setComponent(new ComponentName("com.transsion.phonemaster",
                            "com.transsion.phonemaster.permission.startup.StartupAppListActivity"));
                    context.startActivity(intent);
                    Toast.makeText(context, "Tecno: Enable Auto-start and allow Background Running", Toast.LENGTH_LONG).show();
                    return;
                } catch (Throwable t1) {
                    Intent pmIntent = context.getPackageManager().getLaunchIntentForPackage("com.transsion.phonemaster");
                    if (pmIntent != null) {
                        context.startActivity(pmIntent);
                        Toast.makeText(context, "Phone Master: Whitelist Snap Safety in Auto-start", Toast.LENGTH_LONG).show();
                        return;
                    }
                }
            }
        } catch (Throwable ignored) {
            // Fallback if specific OEM activity does not exist
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent optIntent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                optIntent.setData(Uri.parse("package:" + context.getPackageName()));
                context.startActivity(optIntent);
            }
        } catch (Throwable t) {
            try {
                Intent appSettings = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                appSettings.setData(Uri.parse("package:" + context.getPackageName()));
                context.startActivity(appSettings);
            } catch (Throwable ignored) {}
        }
    }
}
