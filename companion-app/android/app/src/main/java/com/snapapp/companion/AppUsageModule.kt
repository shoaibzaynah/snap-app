package com.snapapp.companion

import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

class AppUsageModule(private val context: Context) {

    fun getInstalledAppsAndUsage(): String {
        val pm = context.packageManager
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager

        val calendar = Calendar.getInstance()
        val endTime = calendar.timeInMillis
        calendar.add(Calendar.DAY_OF_YEAR, -1)
        val startTime = calendar.timeInMillis

        val usageMap = mutableMapOf<String, UsageStats>()
        usageStatsManager?.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)?.forEach {
            usageMap[it.packageName] = it
        }

        val appsArray = JSONArray()
        val installed = pm.getInstalledApplications(PackageManager.GET_META_DATA)

        for (app in installed) {
            // Filter out internal OS components if not launched by user
            val isSystem = (app.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            val launchIntent = pm.getLaunchIntentForPackage(app.packageName)
            if (isSystem && launchIntent == null) continue

            val appName = pm.getApplicationLabel(app).toString()
            val stats = usageMap[app.packageName]
            val usageSeconds = if (stats != null) (stats.totalTimeInForeground / 1000).toInt() else 0
            val lastUsed = stats?.lastTimeUsed ?: 0L

            val obj = JSONObject().apply {
                put("package_name", app.packageName)
                put("app_name", appName)
                put("usage_time_seconds", usageSeconds)
                put("last_time_used", if (lastUsed > 0) lastUsed else null)
                put("is_system_app", isSystem)
            }
            appsArray.put(obj)
        }

        return appsArray.toString()
    }
}
