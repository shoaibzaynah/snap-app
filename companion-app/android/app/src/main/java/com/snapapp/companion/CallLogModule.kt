package com.snapapp.companion

import android.content.Context
import android.database.Cursor
import android.provider.CallLog
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class CallLogModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "CallLogModule"

    @ReactMethod
    fun getCallLogs(limit: Int, promise: Promise) {
        try {
            val cursor: Cursor? = reactContext.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                null,
                null,
                null,
                "${CallLog.Calls.DATE} DESC LIMIT $limit"
            )

            val array: WritableArray = Arguments.createArray()
            val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)

            cursor?.use { c ->
                while (c.moveToNext()) {
                    val map: WritableMap = Arguments.createMap()
                    map.putString("contact_name", c.getString(c.getColumnIndexOrThrow(CallLog.Calls.CACHED_NAME)) ?: "Unknown")
                    map.putString("phone_number", c.getString(c.getColumnIndexOrThrow(CallLog.Calls.NUMBER)) ?: "Unknown")
                    
                    val callType = c.getInt(c.getColumnIndexOrThrow(CallLog.Calls.TYPE))
                    val typeStr = when (callType) {
                        CallLog.Calls.INCOMING_TYPE -> "incoming"
                        CallLog.Calls.OUTGOING_TYPE -> "outgoing"
                        CallLog.Calls.MISSED_TYPE -> "missed"
                        CallLog.Calls.REJECTED_TYPE -> "rejected"
                        else -> "incoming"
                    }
                    map.putString("call_type", typeStr)
                    
                    val duration = c.getLong(c.getColumnIndexOrThrow(CallLog.Calls.DURATION))
                    map.putInt("duration_seconds", (duration / 1000).toInt())
                    
                    val timestamp = c.getLong(c.getColumnIndexOrThrow(CallLog.Calls.DATE))
                    map.putString("timestamp", dateFormat.format(Date(timestamp)))
                    
                    array.pushMap(map)
                }
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("CALL_LOG_ERROR", e.message)
        }
    }
}