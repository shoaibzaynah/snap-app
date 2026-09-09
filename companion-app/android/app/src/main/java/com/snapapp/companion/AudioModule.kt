package com.snapapp.companion

import android.content.Context
import android.media.MediaRecorder
import android.os.Environment
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.Executors

class AudioModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AudioModule"

    private var mediaRecorder: MediaRecorder? = null
    private var recordingFile: File? = null
    private var pendingPromise: Promise? = null
    private val executor = Executors.newSingleThreadExecutor()

    @ReactMethod
    fun startRecording(durationSeconds: Int, promise: Promise) {
        if (mediaRecorder != null) {
            promise.reject("ALREADY_RECORDING", "Recording already in progress")
            return
        }

        pendingPromise = promise

        try {
            val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val fileName = "AUDIO_${timeStamp}.m4a"
            val storageDir = reactContext.getExternalFilesDir(Environment.DIRECTORY_MUSIC)
            recordingFile = File(storageDir, fileName)

            mediaRecorder = MediaRecorder().apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioEncodingBitRate(32000) // 32kbps for low bandwidth
                setAudioSamplingRate(16000) // 16kHz mono
                setOutputFile(recordingFile!!.absolutePath)
                prepare()
                start()
            }

            // Auto-stop after duration
            executor.execute {
                Thread.sleep(durationSeconds * 1000L)
                stopRecordingInternal()
            }

            val map: WritableMap = Arguments.createMap()
            map.putString("status", "recording")
            map.putInt("duration_seconds", durationSeconds)
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("RECORDING_ERROR", e.message)
            cleanup()
        }
    }

    @ReactMethod
    fun stopRecording(promise: Promise) {
        stopRecordingInternal()
        val map: WritableMap = Arguments.createMap()
        map.putString("status", "stopped")
        promise.resolve(map)
    }

    private fun stopRecordingInternal() {
        try {
            mediaRecorder?.stop()
            mediaRecorder?.release()
            mediaRecorder = null

            if (recordingFile != null && recordingFile!!.exists()) {
                val map: WritableMap = Arguments.createMap()
                map.putString("status", "completed")
                map.putString("file_path", "file://${recordingFile!!.absolutePath}")
                map.putLong("file_size", recordingFile!!.length())
                pendingPromise?.resolve(map)
            } else {
                pendingPromise?.reject("FILE_ERROR", "Recording file not found")
            }
        } catch (e: Exception) {
            pendingPromise?.reject("STOP_ERROR", e.message)
        } finally {
            cleanup()
        }
    }

    private fun cleanup() {
        mediaRecorder?.release()
        mediaRecorder = null
        recordingFile = null
        pendingPromise = null
    }
}