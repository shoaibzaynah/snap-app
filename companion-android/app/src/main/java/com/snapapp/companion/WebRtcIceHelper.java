package com.snapapp.companion;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import org.webrtc.PeerConnection;
import java.util.ArrayList;
import java.util.List;

/** Helpers for ICE servers, gathering wait, and audio output routing. Extracted for Rule 14. */
public class WebRtcIceHelper {

    public static List<PeerConnection.IceServer> buildIceServers() {
        List<PeerConnection.IceServer> list = new ArrayList<>();
        for (String u : new String[]{"stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302", "stun:stun.cloudflare.com:3478", "stun:stun.services.mozilla.com"})
            list.add(PeerConnection.IceServer.builder(u).createIceServer());
        String usr = "openrelayproject", pwd = "openrelayproject";
        for (String u : new String[]{"turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443", "turn:openrelay.metered.ca:443?transport=tcp", "turn:standard.relay.metered.ca:443?transport=tcp", "turn:standard.relay.metered.ca:80?transport=tcp"})
            list.add(PeerConnection.IceServer.builder(u).setUsername(usr).setPassword(pwd).createIceServer());
        return list;
    }

    public static org.webrtc.PeerConnectionFactory buildFactory(Context ctx, org.webrtc.EglBase.Context eglCtx) {
        org.webrtc.PeerConnectionFactory.initialize(org.webrtc.PeerConnectionFactory.InitializationOptions.builder(ctx).createInitializationOptions());
        org.webrtc.PeerConnectionFactory.Builder b = org.webrtc.PeerConnectionFactory.builder();
        org.webrtc.PeerConnectionFactory.Options opt = new org.webrtc.PeerConnectionFactory.Options();
        opt.disableNetworkMonitor = true;
        b.setOptions(opt);
        if (eglCtx != null) {
            b.setVideoEncoderFactory(new org.webrtc.DefaultVideoEncoderFactory(eglCtx, true, true));
            b.setVideoDecoderFactory(new org.webrtc.DefaultVideoDecoderFactory(eglCtx));
        } else {
            b.setVideoEncoderFactory(new org.webrtc.SoftwareVideoEncoderFactory());
            b.setVideoDecoderFactory(new org.webrtc.SoftwareVideoDecoderFactory());
        }
        return b.createPeerConnectionFactory();
    }

    public static PeerConnection.RTCConfiguration buildRtcConfig() {
        PeerConnection.RTCConfiguration c = new PeerConnection.RTCConfiguration(buildIceServers());
        c.sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN;
        c.continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY;
        c.iceCandidatePoolSize = 4;
        c.bundlePolicy = PeerConnection.BundlePolicy.MAXBUNDLE;
        c.rtcpMuxPolicy = PeerConnection.RtcpMuxPolicy.REQUIRE;
        c.tcpCandidatePolicy = PeerConnection.TcpCandidatePolicy.ENABLED;
        return c;
    }

    /** Wait up to 1.5s for initial ICE gathering before sending answer SDP */
    public static void waitForIceAndRun(final PeerConnection pc, final String fallbackSdp, final Runnable onReady) {
        if (pc == null) return;
        final Handler h = new Handler(Looper.getMainLooper());
        if (pc.iceGatheringState() == PeerConnection.IceGatheringState.COMPLETE) { onReady.run(); return; }
        final long[] elapsed = {0};
        final Runnable[] poll = new Runnable[1];
        poll[0] = new Runnable() {
            @Override public void run() {
                if (pc == null) return;
                elapsed[0] += 100;
                if (pc.iceGatheringState() == PeerConnection.IceGatheringState.COMPLETE || elapsed[0] >= 1500) {
                    onReady.run();
                } else {
                    h.postDelayed(poll[0], 100);
                }
            }
        };
        h.postDelayed(poll[0], 100);
    }

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

    public static class SimpleSdpObserver implements org.webrtc.SdpObserver {
        @Override public void onCreateSuccess(org.webrtc.SessionDescription s) {}
        @Override public void onSetSuccess() {}
        @Override public void onCreateFailure(String s) {}
        @Override public void onSetFailure(String s) {}
    }
}

