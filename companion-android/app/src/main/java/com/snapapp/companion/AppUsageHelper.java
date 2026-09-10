package com.snapapp.companion;

import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AppUsageHelper {

    public static boolean hasUsagePermission(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) return true;
        try {
            AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
            if (appOps == null) return false;
            int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(), context.getPackageName());
            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) {
            return false;
        }
    }

    public static void promptUsageAccess(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            try {
                Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            } catch (Exception ignored) {}
        }
    }

    public static void syncInstalledApps(final Context context, final String serverUrl, final String deviceId, final String cmdId) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    Map<String, Long> fgMap = new HashMap<>();
                    Map<String, Long> lastUsedMap = new HashMap<>();

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        try {
                            UsageStatsManager usm = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
                            if (usm != null) {
                                long end = System.currentTimeMillis();
                                long start = end - (1000L * 60 * 60 * 24); // 24 hours
                                List<UsageStats> stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, start, end);
                                if (stats != null) {
                                    for (UsageStats u : stats) {
                                        long fg = u.getTotalTimeInForeground();
                                        if (fg > 0) {
                                            Long prev = fgMap.get(u.getPackageName());
                                            fgMap.put(u.getPackageName(), (prev == null ? 0 : prev) + fg);
                                        }
                                        long last = u.getLastTimeUsed();
                                        if (last > 0) {
                                            Long pLast = lastUsedMap.get(u.getPackageName());
                                            if (pLast == null || last > pLast) lastUsedMap.put(u.getPackageName(), last);
                                        }
                                    }
                                }
                            }
                        } catch (Exception ignored) {}
                    }

                    PackageManager pm = context.getPackageManager();
                    List<PackageInfo> packages = pm.getInstalledPackages(0);
                    JSONArray apps = new JSONArray();

                    for (PackageInfo pi : packages) {
                        JSONObject app = new JSONObject();
                        app.put("package_name", pi.packageName);
                        app.put("app_name", pi.applicationInfo.loadLabel(pm).toString());
                        boolean isSystem = (pi.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
                        app.put("is_system_app", isSystem);

                        Long fg = fgMap.get(pi.packageName);
                        long sec = fg != null ? (fg / 1000) : 0;
                        app.put("usage_time_seconds", sec);

                        Long last = lastUsedMap.get(pi.packageName);
                        if (last != null && last > 0) {
                            app.put("last_time_used", last);
                        }
                        apps.put(app);
                    }

                    JSONObject body = new JSONObject();
                    body.put("device_id", deviceId);
                    if (cmdId != null) body.put("command_id", cmdId);
                    body.put("installed_apps", apps);

                    ApiClient.postJson(serverUrl + "/api/device-sync/data", body, null);
                } catch (Exception ignored) {}
            }
        }).start();
    }
}
