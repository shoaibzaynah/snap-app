package com.snapapp.companion;

import android.os.Build;
import okhttp3.*;
import org.json.JSONObject;
import java.io.IOException;

public class ApiClient {
    private static final OkHttpClient client = new OkHttpClient();
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    public interface ApiCallback {
        void onSuccess(JSONObject response);
        void onError(String error);
    }

    public static void pairDevice(String serverUrl, String pairingCode, final ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("pairing_code", pairingCode.trim().toUpperCase());
            body.put("model", Build.MANUFACTURER + " " + Build.MODEL);
            body.put("os_version", "Android " + Build.VERSION.RELEASE);

            Request request = new Request.Builder()
                    .url(serverUrl + "/api/device-sync/heartbeat")
                    .post(RequestBody.create(body.toString(), JSON))
                    .build();

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    callback.onError("Connection failed: " + e.getMessage());
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    try {
                        String respBody = response.body() != null ? response.body().string() : "{}";
                        JSONObject json = new JSONObject(respBody);
                        if (response.isSuccessful()) {
                            callback.onSuccess(json);
                        } else {
                            callback.onError(json.optString("error", "Pairing rejected"));
                        }
                    } catch (Exception e) {
                        callback.onError("Parse error: " + e.getMessage());
                    }
                }
            });
        } catch (Exception e) {
            callback.onError(e.getMessage());
        }
    }

    public static void sendLocation(String serverUrl, String deviceId, double lat, double lng,
                                    float accuracy, int battery, final ApiCallback callback) {
        try {
            JSONObject body = new JSONObject();
            body.put("device_id", deviceId);
            body.put("latitude", lat);
            body.put("longitude", lng);
            body.put("accuracy", accuracy);
            body.put("battery_level", battery);

            Request request = new Request.Builder()
                    .url(serverUrl + "/api/device-sync/location")
                    .post(RequestBody.create(body.toString(), JSON))
                    .build();

            client.newCall(request).enqueue(new Callback() {
                @Override
                public void onFailure(Call call, IOException e) {
                    if (callback != null) callback.onError(e.getMessage());
                }

                @Override
                public void onResponse(Call call, Response response) throws IOException {
                    if (callback != null) {
                        try {
                            String resp = response.body() != null ? response.body().string() : "{}";
                            callback.onSuccess(new JSONObject(resp));
                        } catch (Exception ignored) {}
                    }
                }
            });
        } catch (Exception ignored) {}
    }

    public static void checkVersion(String serverUrl, final ApiCallback callback) {
        Request request = new Request.Builder()
                .url(serverUrl + "/api/companion/version")
                .get()
                .build();

        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                if (callback != null) callback.onError(e.getMessage());
            }

            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (callback != null && response.isSuccessful()) {
                    try {
                        String resp = response.body() != null ? response.body().string() : "{}";
                        callback.onSuccess(new JSONObject(resp));
                    } catch (Exception ignored) {}
                }
            }
        });
    }
}
