package com.snapapp.companion;

import android.content.Context;
import org.webrtc.*;

/** Helper for camera capturer creation, orientation, and camera switching. Extracted for Rule 14. */
public class WebRtcCameraHelper {

    public static VideoCapturer createCapturer(Context ctx, boolean front, boolean hasEgl) {
        if (hasEgl) {
            try {
                Camera2Enumerator e2 = new Camera2Enumerator(ctx);
                for (String n : e2.getDeviceNames()) {
                    if ((front && e2.isFrontFacing(n)) || (!front && e2.isBackFacing(n))) {
                        VideoCapturer c = e2.createCapturer(n, null);
                        if (c != null) return c;
                    }
                }
            } catch (Throwable ignored) {}
        }
        try {
            Camera1Enumerator e1 = new Camera1Enumerator(hasEgl);
            for (String n : e1.getDeviceNames()) {
                if ((front && e1.isFrontFacing(n)) || (!front && e1.isBackFacing(n))) {
                    VideoCapturer c = e1.createCapturer(n, null);
                    if (c != null) return c;
                }
            }
            String[] names = e1.getDeviceNames();
            if (names != null && names.length > 0) return e1.createCapturer(names[0], null);
        } catch (Throwable ignored) {}
        return null;
    }

    public static void setOrientation(VideoCapturer capturer, String ori) {
        if (capturer == null) return;
        try {
            if ("landscape".equalsIgnoreCase(ori)) capturer.changeCaptureFormat(640, 360, 15);
            else capturer.changeCaptureFormat(360, 480, 15);
        } catch (Throwable ignored) {}
    }

    public static boolean switchCamera(VideoCapturer capturer, boolean currentFront) {
        if (capturer instanceof CameraVideoCapturer) {
            try {
                ((CameraVideoCapturer) capturer).switchCamera(null);
                return !currentFront;
            } catch (Throwable ignored) {}
        }
        return currentFront;
    }
}
