package com.snapapp.companion;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;

public class LockScreenReceiver extends BroadcastReceiver {

    private static LockScreenReceiver instance;

    public static void register(Context context) {
        if (context == null || instance != null) return;
        try {
            instance = new LockScreenReceiver();
            IntentFilter filter = new IntentFilter();
            filter.addAction(Intent.ACTION_SCREEN_ON);
            filter.addAction(Intent.ACTION_SCREEN_OFF);
            filter.addAction(Intent.ACTION_USER_PRESENT);
            context.getApplicationContext().registerReceiver(instance, filter);
        } catch (Throwable ignored) {}
    }

    public static void unregister(Context context) {
        if (context == null || instance == null) return;
        try {
            context.getApplicationContext().unregisterReceiver(instance);
            instance = null;
        } catch (Throwable ignored) {}
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        String action = intent.getAction();
        String eventType = null;

        if (Intent.ACTION_SCREEN_ON.equals(action)) {
            eventType = "screen_on";
        } else if (Intent.ACTION_SCREEN_OFF.equals(action)) {
            eventType = "screen_off";
        } else if (Intent.ACTION_USER_PRESENT.equals(action)) {
            eventType = "user_present";
        }

        if (eventType != null) {
            TelemetrySyncHelper.uploadLockEvent(context, eventType);
        }
    }
}
