package com.snapapp.companion;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import org.json.JSONObject;

public class SirenHelper {
    private static MediaPlayer player;

    public static synchronized void playSiren(final Context context, final String serverUrl, final String deviceId, final String cmdId) {
        stopSiren();
        try {
            AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                am.setStreamVolume(AudioManager.STREAM_ALARM, maxVol, 0);
            }
            Uri alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alert == null) alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);

            player = new MediaPlayer();
            player.setDataSource(context, alert);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                player.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build());
            } else {
                player.setAudioStreamType(AudioManager.STREAM_ALARM);
            }
            player.setLooping(true);
            player.prepare();
            player.start();

            new Handler(Looper.getMainLooper()).postDelayed(() -> stopSiren(), 10000);
        } catch (Throwable t) {
            try {
                Uri alert = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                Ringtone r = RingtoneManager.getRingtone(context.getApplicationContext(), alert);
                if (r != null) r.play();
            } catch (Throwable ignored) {}
        }

        if (cmdId != null && serverUrl != null && deviceId != null) {
            new Thread(() -> {
                try {
                    JSONObject b = new JSONObject();
                    b.put("device_id", deviceId);
                    b.put("command_id", cmdId);
                    ApiClient.postJson(serverUrl + "/api/device-sync/data", b, null);
                } catch (Throwable ignored) {}
            }).start();
        }
    }

    public static synchronized void stopSiren() {
        if (player != null) {
            try {
                if (player.isPlaying()) player.stop();
                player.release();
            } catch (Throwable ignored) {}
            player = null;
        }
    }
}
