package com.snapapp.companion;

import android.app.DownloadManager;
import android.content.*;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import org.json.JSONObject;
import java.io.File;

public class AutoUpdater {
    private static final int CURRENT_VERSION = 2;

    public static void checkForUpdate(final Context context, final String serverUrl, final boolean showToastIfLatest) {
        ApiClient.checkVersion(serverUrl, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                int latestVersion = response.optInt("version_code", CURRENT_VERSION);
                String apkUrl = response.optString("apk_url", "/api/downloads/companion");

                if (latestVersion > CURRENT_VERSION) {
                    String fullUrl = apkUrl.startsWith("http") ? apkUrl : serverUrl + apkUrl;
                    downloadAndInstall(context, fullUrl);
                } else if (showToastIfLatest) {
                    Toast.makeText(context, "System Companion is already on the latest version", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onError(String error) {
                if (showToastIfLatest) {
                    Toast.makeText(context, "Update check failed: " + error, Toast.LENGTH_SHORT).show();
                }
            }
        });
    }

    private static void downloadAndInstall(final Context context, String downloadUrl) {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(downloadUrl));
            request.setTitle("System Security Update");
            request.setDescription("Downloading latest companion update...");
            request.setMimeType("application/vnd.android.package-archive");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, "update.apk");

            final DownloadManager dm = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            if (dm == null) return;
            final long downloadId = dm.enqueue(request);

            BroadcastReceiver onComplete = new BroadcastReceiver() {
                @Override
                public void onReceive(Context ctx, Intent intent) {
                    long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                    if (id == downloadId) {
                        ctx.unregisterReceiver(this);
                        installApk(ctx);
                    }
                }
            };

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                context.registerReceiver(onComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_NOT_EXPORTED);
            } else {
                context.registerReceiver(onComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
            }
        } catch (Exception ignored) {}
    }

    private static void installApk(Context context) {
        try {
            File file = new File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "update.apk");
            if (!file.exists()) return;

            Uri apkUri = FileProvider.getUriForFile(context, context.getPackageName() + ".provider", file);
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception ignored) {}
    }
}
