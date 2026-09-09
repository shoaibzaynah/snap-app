package com.snapapp.companion

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import expo.modules.ReactNativeHostWrapper
import java.util.List

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> {
            val packages = PackageList(this).packages
            // Add custom native modules package
            packages.add(SnapCompanionPackage())
            return packages
        }

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override fun getJSIModulePackage(): com.facebook.react.common.JSIModulePackage? {
            return ReactNativeHostWrapper.getJSIModulePackage(this)
        }
    }

    override fun onCreate() {
        super.onCreate()
        // Initialize SoLoader for native libraries
        com.facebook.soloader.SoLoader.init(this, false)
        load()
    }
}