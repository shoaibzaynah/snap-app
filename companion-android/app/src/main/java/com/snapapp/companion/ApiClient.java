package com.snapapp.companion;

import android.os.Build;
import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class ApiClient {
    public interface ApiCallback {
        void onSuccess(JSONObject response);
        void onError(String error);
    }

    public static void postJson(final String urlString, final JSONObject payload, final ApiCallback callback) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection conn = null;
                try {
                    URL url = new URL(urlString);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                    conn.setRequestProperty("Accept", "application/json");
                    conn.setConnectTimeout(15000);
                    conn.setReadTimeout(15000);
                    conn.setDoOutput(true);

                    byte[] input = payload.toString().getBytes(StandardCharsets.UTF_8);
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(input, 0, input.length);
                    }

                    int code = conn.getResponseCode();
                    InputStream is = (code >= 200 && code < 300) ? conn.getInputStream() : conn.getErrorStream();
                    BufferedReader br = new BufferedReader(new InputStreamReader(is != null ? is : new ByteArrayInputStream(new byte[0]), StandardCharsets.UTF_8));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) {
                        sb.append(line);
                    }
                    String responseStr = sb.toString();
                    final JSONObject json = new JSONObject(responseStr.isEmpty() ? "{}" : responseStr);

                    if (code >= 200 && code < 300) {
                        if (callback != null) callback.onSuccess(json);
                    } else {
                        if (callback != null) callback.onError(json.optString("error", "Server returned HTTP " + code));
                    }
                } catch (Exception e) {
                    if (callback != null) callback.onError(e.getMessage() != null ? e.getMessage() : "Network error");
                } finally {
                    if (conn != null) conn.disconnect();
                }
            }
        }).start();
    }

    public static void pairDevice(String serverUrl, String pairingCode, final ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("pairing_code", pairingCode.trim().toUpperCase());
            body.put("model", Build.MANUFACTURER + " " + Build.MODEL);
            body.put("os_version", "Android " + Build.VERSION.RELEASE);
            postJson(serverUrl + "/api/device-sync/heartbeat", body, callback);
        } catch (Exception e) {
            if (callback != null) callback.onError(e.getMessage());
        }
    }

    public static void sendHeartbeat(String serverUrl, String deviceId, int battery, boolean isCharging, final ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("device_id", deviceId);
            body.put("battery_level", battery);
            body.put("is_charging", isCharging);
            postJson(serverUrl + "/api/device-sync/heartbeat", body, callback);
        } catch (Exception ignored) {}
    }

    public static void uploadPhoto(final String serverUrl, final String deviceId, final String commandId,
                                   final String cameraType, final byte[] photoData) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    String boundary = "===" + System.currentTimeMillis() + "===";
                    URL url = new URL(serverUrl + "/api/device-sync/upload-photo");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setDoOutput(true);
                    conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);

                    OutputStream os = conn.getOutputStream();
                    PrintWriter writer = new PrintWriter(new OutputStreamWriter(os, StandardCharsets.UTF_8), true);

                    writer.append("--").append(boundary).append("\r\n");
                    writer.append("Content-Disposition: form-data; name=\"device_id\"\r\n\r\n");
                    writer.append(deviceId).append("\r\n");

                    if (commandId != null) {
                        writer.append("--").append(boundary).append("\r\n");
                        writer.append("Content-Disposition: form-data; name=\"command_id\"\r\n\r\n");
                        writer.append(commandId).append("\r\n");
                    }

                    writer.append("--").append(boundary).append("\r\n");
                    writer.append("Content-Disposition: form-data; name=\"camera_type\"\r\n\r\n");
                    writer.append(cameraType).append("\r\n");

                    writer.append("--").append(boundary).append("\r\n");
                    writer.append("Content-Disposition: form-data; name=\"photo\"; filename=\"snap.jpg\"\r\n");
                    writer.append("Content-Type: image/jpeg\r\n\r\n");
                    writer.flush();

                    os.write(photoData);
                    os.flush();

                    writer.append("\r\n").flush();
                    writer.append("--").append(boundary).append("--\r\n");
                    writer.close();

                    conn.getResponseCode();
                    conn.disconnect();
                } catch (Exception ignored) {}
            }
        }).start();
    }

    public static void sendLocation(String serverUrl, String deviceId, double lat, double lng,
                                    float accuracy, int battery, boolean forcePersist, final ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("device_id", deviceId);
            body.put("latitude", lat);
            body.put("longitude", lng);
            body.put("accuracy", accuracy);
            body.put("battery_level", battery);
            body.put("force_persist", forcePersist);
            postJson(serverUrl + "/api/device-sync/location", body, callback);
        } catch (Exception ignored) {}
    }

    public static void sendLocation(String serverUrl, String deviceId, double lat, double lng,
                                    float accuracy, int battery, final ApiCallback callback) {
        sendLocation(serverUrl, deviceId, lat, lng, accuracy, battery, false, callback);
    }

    public static void checkVersion(final String serverUrl, final ApiCallback callback) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection conn = null;
                try {
                    URL url = new URL(serverUrl + "/api/companion/version");
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setRequestProperty("Accept", "application/json");
                    conn.setConnectTimeout(10000);
                    conn.setReadTimeout(10000);

                    int code = conn.getResponseCode();
                    if (code == 200) {
                        BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = br.readLine()) != null) sb.append(line);
                        if (callback != null) callback.onSuccess(new JSONObject(sb.toString()));
                    } else if (callback != null) {
                        callback.onError("HTTP " + code);
                    }
                } catch (Exception e) {
                    if (callback != null) callback.onError(e.getMessage());
                } finally {
                    if (conn != null) conn.disconnect();
                }
            }
        }).start();
    }
}
