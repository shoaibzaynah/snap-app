package com.snapapp.companion;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.hardware.Camera;
import android.os.Handler;
import android.os.Looper;

public class CameraHelper {
    public interface PhotoCallback {
        void onPhotoCaptured(byte[] data);
        void onError(String error);
    }

    @SuppressWarnings("deprecation")
    public static void takeSilentPhoto(final Context context, final boolean isFront, final PhotoCallback callback) {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                Camera camera = null;
                try {
                    int cameraId = -1;
                    int numCameras = Camera.getNumberOfCameras();
                    Camera.CameraInfo info = new Camera.CameraInfo();
                    for (int i = 0; i < numCameras; i++) {
                        Camera.getCameraInfo(i, info);
                        if (isFront && info.facing == Camera.CameraInfo.CAMERA_FACING_FRONT) {
                            cameraId = i;
                            break;
                        } else if (!isFront && info.facing == Camera.CameraInfo.CAMERA_FACING_BACK) {
                            cameraId = i;
                            break;
                        }
                    }
                    if (cameraId == -1) cameraId = 0;

                    camera = Camera.open(cameraId);
                    SurfaceTexture dummySurface = new SurfaceTexture(0);
                    camera.setPreviewTexture(dummySurface);
                    camera.startPreview();

                    final Camera finalCam = camera;
                    camera.takePicture(null, null, new Camera.PictureCallback() {
                        @Override
                        public void onPictureTaken(byte[] data, Camera cam) {
                            try {
                                cam.stopPreview();
                                cam.release();
                            } catch (Exception ignored) {}
                            if (callback != null) callback.onPhotoCaptured(data);
                        }
                    });
                } catch (Exception e) {
                    if (camera != null) {
                        try { camera.release(); } catch (Exception ignored) {}
                    }
                    if (callback != null) callback.onError(e.getMessage());
                }
            }
        });
    }
}
