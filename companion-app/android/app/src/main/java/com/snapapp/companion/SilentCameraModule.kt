package com.snapapp.companion

import android.content.Context
import android.graphics.ImageFormat
import android.graphics.SurfaceTexture
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraMetadata
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.params.StreamConfigurationMap
import android.media.Image
import android.media.ImageReader
import android.os.Handler
import android.os.HandlerThread
import android.util.Size
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.Semaphore

class SilentCameraModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SilentCameraModule"

    private var backgroundThread: HandlerThread? = null
    private var backgroundHandler: Handler? = null
    private var cameraDevice: CameraDevice? = null
    private var imageReader: ImageReader? = null
    private var cameraId: String = "0"
    private var captureSemaphore: Semaphore? = null
    private var pendingPromise: Promise? = null
    private var currentCameraType: String = "front"

    private fun startBackgroundThread() {
        backgroundThread = HandlerThread("CameraBackground")
        backgroundThread?.start()
        backgroundHandler = Handler(backgroundThread?.looper)
    }

    private fun stopBackgroundThread() {
        backgroundThread?.quitSafely()
        try {
            backgroundThread?.join()
            backgroundThread = null
            backgroundHandler = null
        } catch (e: InterruptedException) {
            e.printStackTrace()
        }
    }

    private fun getCameraId(cameraType: String): String {
        val cameraManager = reactContext.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        try {
            val cameraIds = cameraManager.cameraIdList
            for (id in cameraIds) {
                val characteristics = cameraManager.getCameraCharacteristics(id)
                val facing = characteristics.get(CameraCharacteristics.LENS_FACING)
                if ((cameraType == "front" && facing == CameraMetadata.LENS_FACING_FRONT) ||
                    (cameraType == "back" && facing == CameraMetadata.LENS_FACING_BACK)) {
                    return id
                }
            }
        } catch (e: CameraAccessException) {
            e.printStackTrace()
        }
        return "0"
    }

    @ReactMethod
    fun takeSilentPhoto(cameraType: String, promise: Promise) {
        currentCameraType = cameraType
        pendingPromise = promise
        cameraId = getCameraId(cameraType)

        startBackgroundThread()
        captureSemaphore = Semaphore(1)

        val cameraManager = reactContext.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        try {
            val characteristics = cameraManager.getCameraCharacteristics(cameraId)
            val map = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP) as StreamConfigurationMap
            val largest = map.getOutputSizes(ImageFormat.JPEG)?.maxByOrNull { it.width * it.height } ?: Size(640, 480)

            imageReader = ImageReader.newInstance(largest.width, largest.height, ImageFormat.JPEG, 2)
            imageReader?.setOnImageAvailableListener(onImageAvailableListener, backgroundHandler)

            cameraManager.openCamera(cameraId, cameraStateCallback, backgroundHandler)
        } catch (e: Exception) {
            promise.reject("CAMERA_ERROR", e.message)
            stopBackgroundThread()
        }
    }

    private val cameraStateCallback = object : CameraDevice.StateCallback() {
        override fun onOpened(camera: CameraDevice) {
            cameraDevice = camera
            takePicture()
        }

        override fun onDisconnected(camera: CameraDevice) {
            camera.close()
            cameraDevice = null
            pendingPromise?.reject("CAMERA_DISCONNECTED", "Camera disconnected")
            pendingPromise = null
            stopBackgroundThread()
        }

        override fun onError(camera: CameraDevice, error: Int) {
            camera.close()
            cameraDevice = null
            pendingPromise?.reject("CAMERA_ERROR", "Camera error: $error")
            pendingPromise = null
            stopBackgroundThread()
        }
    }

    private fun takePicture() {
        try {
            val captureRequestBuilder = cameraDevice?.createCaptureRequest(CameraDevice.TEMPLATE_STILL_CAPTURE)
            captureRequestBuilder?.addTarget(imageReader?.surface)
            captureRequestBuilder?.set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO)

            val captureCallback = object : CameraDevice.CaptureCallback() {
                override fun onCaptureCompleted(camera: CameraDevice, request: CaptureRequest, result: android.hardware.camera2.TotalCaptureResult) {
                    // Capture completed
                }
            }

            cameraDevice?.createCaptureSession(listOf(imageReader?.surface!!), object : CameraDevice.StateCallback() {
                override fun onConfigured(session: android.hardware.camera2.CameraCaptureSession) {
                    try {
                        session.capture(captureRequestBuilder!!.build(), captureCallback, backgroundHandler)
                    } catch (e: CameraAccessException) {
                        e.printStackTrace()
                    }
                }

                override fun onConfigureFailed(session: android.hardware.camera2.CameraCaptureSession) {
                    pendingPromise?.reject("SESSION_FAILED", "Camera session configuration failed")
                    pendingPromise = null
                    stopBackgroundThread()
                }
            }, backgroundHandler)
        } catch (e: Exception) {
            e.printStackTrace()
            pendingPromise?.reject("CAPTURE_ERROR", e.message)
            pendingPromise = null
            stopBackgroundThread()
        }
    }

    private val onImageAvailableListener = ImageReader.OnImageAvailableListener { reader ->
        val image: Image? = reader.acquireLatestImage()
        image?.let { img ->
            val buffer: ByteBuffer = img.planes[0].buffer
            val bytes = ByteArray(buffer.remaining())
            buffer.get(bytes)

            val file = saveImageToFile(bytes)
            if (file != null) {
                val map: WritableMap = Arguments.createMap()
                map.putString("uri", "file://${file.absolutePath}")
                pendingPromise?.resolve(map)
            } else {
                pendingPromise?.reject("SAVE_ERROR", "Failed to save image")
            }
            pendingPromise = null
            img.close()
            closeCamera()
            stopBackgroundThread()
        }
    }

    private fun saveImageToFile(bytes: ByteArray): File? {
        try {
            val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
            val fileName = "SNAP_${timeStamp}_${currentCameraType}.jpg"
            val storageDir = reactContext.getExternalFilesDir(android.os.Environment.DIRECTORY_PICTURES)
            val file = File(storageDir, fileName)
            FileOutputStream(file).use { it.write(bytes) }
            return file
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    private fun closeCamera() {
        cameraDevice?.close()
        cameraDevice = null
        imageReader?.close()
        imageReader = null
    }
}