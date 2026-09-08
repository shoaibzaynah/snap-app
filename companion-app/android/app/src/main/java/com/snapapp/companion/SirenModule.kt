package com.snapapp.companion

import android.content.Context
import android.media.AudioManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SirenModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SirenModule"
    }

    @ReactMethod
    fun maximizeVolume() {
        try {
            val audioManager =
                reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            audioManager.setStreamVolume(
                AudioManager.STREAM_MUSIC,
                maxVolume,
                AudioManager.FLAG_REMOVE_SOUND_AND_VIBRATE
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
