package com.snapapp.companion;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import okhttp3.*;
import org.json.JSONObject;
import java.util.concurrent.TimeUnit;

public class RealtimeSocketManager {
    private static RealtimeSocketManager instance;
    private final Context context;
    private OkHttpClient client;
    private WebSocket webSocket;
    private String currentWsUrl;
    private String currentDeviceId;
    private String currentServerUrl;
    private boolean isConnecting = false;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private int refCounter = 1;

    private RealtimeSocketManager(Context context) {
        this.context = context.getApplicationContext();
        this.client = new OkHttpClient.Builder()
                .readTimeout(0, TimeUnit.MILLISECONDS)
                .pingInterval(15, TimeUnit.SECONDS)
                .retryOnConnectionFailure(true)
                .build();
    }

    public static synchronized RealtimeSocketManager getInstance(Context context) {
        if (instance == null) instance = new RealtimeSocketManager(context);
        return instance;
    }

    public synchronized void connect(String wsUrl, String deviceId, String serverUrl) {
        if (wsUrl == null || deviceId == null) return;
        if (webSocket != null && wsUrl.equals(currentWsUrl) && deviceId.equals(currentDeviceId)) return;

        this.currentWsUrl = wsUrl;
        this.currentDeviceId = deviceId;
        this.currentServerUrl = serverUrl;

        disconnect();
        startConnection();
    }

    private void startConnection() {
        if (isConnecting || currentWsUrl == null) return;
        isConnecting = true;

        Request request = new Request.Builder().url(currentWsUrl).build();
        webSocket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket ws, Response response) {
                isConnecting = false;
                joinChannel("realtime:device:" + currentDeviceId);
                joinChannel("realtime:webrtc:" + currentDeviceId);
                schedulePhoenixHeartbeat();
            }

            @Override
            public void onMessage(WebSocket ws, String text) {
                handleIncomingMessage(text);
            }

            @Override
            public void onClosed(WebSocket ws, int code, String reason) {
                isConnecting = false;
                scheduleReconnect();
            }

            @Override
            public void onFailure(WebSocket ws, Throwable t, Response response) {
                isConnecting = false;
                scheduleReconnect();
            }
        });
    }

    private void joinChannel(String topic) {
        if (webSocket == null) return;
        try {
            JSONObject join = new JSONObject();
            join.put("topic", topic);
            join.put("event", "phx_join");
            join.put("payload", new JSONObject());
            join.put("ref", String.valueOf(refCounter++));
            webSocket.send(join.toString());
        } catch (Exception ignored) {}
    }

    private void schedulePhoenixHeartbeat() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                if (webSocket != null) {
                    try {
                        JSONObject hb = new JSONObject();
                        hb.put("topic", "phoenix");
                        hb.put("event", "heartbeat");
                        hb.put("payload", new JSONObject());
                        hb.put("ref", String.valueOf(refCounter++));
                        webSocket.send(hb.toString());
                        schedulePhoenixHeartbeat();
                    } catch (Exception ignored) {}
                }
            }
        }, 15000);
    }

    private void handleIncomingMessage(String text) {
        try {
            JSONObject msg = new JSONObject(text);
            String event = msg.optString("event", "");
            if ("broadcast".equals(event)) {
                JSONObject payload = msg.optJSONObject("payload");
                if (payload == null) return;
                String bEvent = payload.optString("event", "");
                if ("command".equals(bEvent)) {
                    JSONObject cmdData = payload.optJSONObject("payload");
                    if (cmdData != null) {
                        CommandDispatcher.dispatch(context, currentServerUrl, currentDeviceId, cmdData, null);
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    private void scheduleReconnect() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                startConnection();
            }
        }, 5000);
    }

    public synchronized void disconnect() {
        if (webSocket != null) {
            try { webSocket.close(1000, "Normal closure"); } catch (Exception ignored) {}
            webSocket = null;
        }
        isConnecting = false;
    }
}
