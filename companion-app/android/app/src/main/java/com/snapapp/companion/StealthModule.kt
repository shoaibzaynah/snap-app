package com.snapapp.companion

import android.content.ComponentName
import android.content.pm.PackageManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class StealthModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "StealthModule"
    }

    @ReactMethod
    fun hideAppIcon() {
        try {
            val pm = reactContext.packageManager
            val componentName = ComponentName(reactContext, MainActivity::class.java)
            pm.setComponentEnabledSetting(
                componentName,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    @ReactMethod
    fun showAppIcon() {
        try {
            val pm = reactContext.packageManager
            val componentName = ComponentName(reactContext, MainActivity::class.java)
            pm.setComponentEnabledSetting(
                componentName,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
