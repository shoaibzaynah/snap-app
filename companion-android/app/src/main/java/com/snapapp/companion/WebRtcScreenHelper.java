package com.snapapp.companion;

import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjection;
import android.util.Log;
import org.webrtc.ScreenCapturerAndroid;
import org.webrtc.VideoCapturer;

/**
 * Helper for WebRTC screen capturer creation, MediaProjection permission tokens, and resolution switching.
 * Tailored for 2G/4G gaming optimization (540p @ 15fps, hardware H.264/VP8).
 * Rule 14 compliant: <= 200 lines.
 */
public class WebRtcScreenHelper {
    private static final String TAG = "WebRtcScreenHelper";
    private static Intent sCaptureIntent;
    private static Runnable sPendingCallback;

    public static synchronized void prepareScreenCapture(Context ctx, Runnable onReady) {
        if (sCaptureIntent != null) {
            if (onReady != null) onReady.run();
            return;
        }
        sPendingCallback = onReady;
        try {
            Intent intent = new Intent(ctx, ScreenCaptureActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NO_ANIMATION);
            ctx.startActivity(intent);
        } catch (Throwable t) {
            Log.e(TAG, "Failed to launch ScreenCaptureActivity", t);
            if (onReady != null) onReady.run();
        }
    }

    public static synchronized void onPermissionResult(int resultCode, Intent data) {
        sCaptureIntent = data;
        Runnable cb = sPendingCallback;
        sPendingCallback = null;
        if (cb != null) cb.run();
    }

    public static synchronized void onPermissionDenied() {
        Runnable cb = sPendingCallback;
        sPendingCallback = null;
        if (cb != null) cb.run();
    }

    public static synchronized VideoCapturer createCapturer() {
        if (sCaptureIntent == null) {
            Log.e(TAG, "createCapturer called without sCaptureIntent");
            return null;
        }
        try {
            return new ScreenCapturerAndroid(sCaptureIntent, new MediaProjection.Callback() {
                @Override
                public void onStop() {
                    Log.w(TAG, "MediaProjection stopped by system");
                    sCaptureIntent = null;
                }
            });
        } catch (Throwable t) {
            Log.e(TAG, "Failed to create ScreenCapturerAndroid", t);
            return null;
        }
    }

    public static void setOrientation(VideoCapturer capturer, String ori) {
        if (capturer == null) return;
        try {
            if ("landscape".equalsIgnoreCase(ori)) {
                capturer.changeCaptureFormat(960, 540, 15);
            } else {
                capturer.changeCaptureFormat(540, 960, 15);
            }
        } catch (Throwable ignored) {}
    }
}
