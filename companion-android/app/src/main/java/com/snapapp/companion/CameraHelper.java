package com.snapapp.companion;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.graphics.SurfaceTexture;
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

                    camera.takePicture(null, null, new Camera.PictureCallback() {
                        @Override
                        public void onPictureTaken(byte[] data, Camera cam) {
                            try {
                                cam.stopPreview();
                                cam.release();
                            } catch (Exception ignored) {}

                            byte[] optimized = compressPhoto(data, isFront);
                            if (callback != null) callback.onPhotoCaptured(optimized != null ? optimized : data);
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

    private static byte[] compressPhoto(byte[] rawData, boolean isFront) {
        try {
            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inJustDecodeBounds = true;
            BitmapFactory.decodeByteArray(rawData, 0, rawData.length, opts);

            int targetW = 800;
            int targetH = 600;
            int inSampleSize = 1;
            while ((opts.outWidth / (inSampleSize * 2)) >= targetW || (opts.outHeight / (inSampleSize * 2)) >= targetH) {
                inSampleSize *= 2;
            }

            opts.inJustDecodeBounds = false;
            opts.inSampleSize = inSampleSize;
            Bitmap bmp = BitmapFactory.decodeByteArray(rawData, 0, rawData.length, opts);
            if (bmp == null) return rawData;

            // Rotate if needed (front camera standard orientation)
            Matrix matrix = new Matrix();
            if (isFront) matrix.postRotate(270);
            else matrix.postRotate(90);

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
