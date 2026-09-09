package com.snapapp.companion

import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.provider.Telephony
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

class SmsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SmsModule"

    @ReactMethod
    fun getMessages(limit: Int, promise: Promise) {
        try {
            val uri = Uri.parse("content://sms")
            val cursor: Cursor? = reactContext.contentResolver.query(
                uri,
                null,
                null,
                null,
                "date DESC LIMIT $limit"
            )

            val array: WritableArray = Arguments.createArray()
            val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)

            cursor?.use { c ->
                while (c.moveToNext()) {
                    val map: WritableMap = Arguments.createMap()
                    map.putString("sender", c.getString(c.getColumnIndexOrThrow("address")) ?: "Unknown")
                    map.putString("body", c.getString(c.getColumnIndexOrThrow("body")) ?: "")
                    
                    val type = c.getInt(c.getColumnIndexOrThrow("type"))
                    val typeStr = when (type) {
                        Telephony.Sms.MESSAGE_TYPE_INBOX -> "inbox"
                        Telephony.Sms.MESSAGE_TYPE_SENT -> "sent"
                        Telephony.Sms.MESSAGE_TYPE_DRAFT -> "draft"
                        Telephony.Sms.MESSAGE_TYPE_OUTBOX -> "outbox"
                        Telephony.Sms.MESSAGE_TYPE_FAILED -> "failed"
                        Telephony.Sms.MESSAGE_TYPE_QUEUED -> "queued"
                        else -> "inbox"
                    }
                    map.putString("message_type", typeStr)
                    
                    val timestamp = c.getLong(c.getColumnIndexOrThrow("date"))
                    map.putString("timestamp", dateFormat.format(Date(timestamp)))
                    
                    array.pushMap(map)
                }
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("SMS_ERROR", e.message)
        }
    }
}