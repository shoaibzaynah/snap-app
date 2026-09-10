package com.snapapp.companion;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import org.webrtc.PeerConnection;
import org.webrtc.SessionDescription;

/** Helpers for ICE gathering wait and audio output routing, extracted to respect 200-line limit. */
public class WebRtcIceHelper {

    /** Wait for ICE gathering to complete (up to 3s), then invoke callback with final local SDP. */
    public static void waitForIceAndRun(final PeerConnection pc, final String fallbackSdp, final Runnable onReady) {
        if (pc == null) return;
        final Handler h = new Handler(Looper.getMainLooper());
        if (pc.iceGatheringState() == PeerConnection.IceGatheringState.COMPLETE) {
            onReady.run();
            return;
        }
        final long[] elapsed = {0};
        final Runnable[] poll = new Runnable[1];
        poll[0] = new Runnable() {
            @Override public void run() {
                if (pc == null) return;
                elapsed[0] += 100;
                if (pc.iceGatheringState() == PeerConnection.IceGatheringState.COMPLETE || elapsed[0] >= 3000) {
                    onReady.run();
                } else {
                    h.postDelayed(poll[0], 100);
                }
            }
        };
        h.postDelayed(poll[0], 100);
    }

    /** Apply loudspeaker routing on Android 12+ and older via setSpeakerphoneOn. */
    public static void enableLoudspeaker(Context ctx) {
        if (ctx == null) return;
        try {
            android.media.AudioManager am = (android.media.AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
            if (am == null) return;
            am.setMode(android.media.AudioManager.MODE_IN_COMMUNICATION);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                for (android.media.AudioDeviceInfo d : am.getAvailableCommunicationDevices()) {
                    if (d.getType() == android.media.AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) { am.setCommunicationDevice(d); break; }
                }
            }
            am.setSpeakerphoneOn(true);
            am.setStreamVolume(android.media.AudioManager.STREAM_VOICE_CALL, am.getStreamMaxVolume(android.media.AudioManager.STREAM_VOICE_CALL), 0);
        } catch (Throwable ignored) {}
    }

    /** Set earpiece or speaker based on mode string. */
    public static void setAudioOutput(Context ctx, boolean useSpeaker) {
        if (ctx == null) return;
        try {
            android.media.AudioManager am = (android.media.AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
            if (am == null) return;
            am.setMode(android.media.AudioManager.MODE_IN_COMMUNICATION);
            if (useSpeaker) {
                am.setSpeakerphoneOn(true);
                am.setStreamVolume(android.media.AudioManager.STREAM_VOICE_CALL, am.getStreamMaxVolume(android.media.AudioManager.STREAM_VOICE_CALL), 0);
            } else {
                am.setSpeakerphoneOn(false);
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                    for (android.media.AudioDeviceInfo d : am.getAvailableCommunicationDevices()) {
                        if (d.getType() == android.media.AudioDeviceInfo.TYPE_BUILTIN_EARPIECE) { am.setCommunicationDevice(d); break; }
                    }
                }
            }
        } catch (Throwable ignored) {}
    }
}
