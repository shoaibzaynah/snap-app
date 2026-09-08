package com.snapapp.companion

import android.content.Context
import android.provider.MediaStore
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.InputStream

class FileManagerModule(private val context: Context) {

    fun indexMediaFiles(limit: Int = 100): String {
        val array = JSONArray()
        val projection = arrayOf(
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            MediaStore.MediaColumns.SIZE,
            MediaStore.MediaColumns.DATE_MODIFIED,
            MediaStore.MediaColumns.MIME_TYPE
        )

        // Query Photos & Images
        val imageCursor = context.contentResolver.query(
            MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
            projection, null, null,
            "${MediaStore.MediaColumns.DATE_MODIFIED} DESC"
        )

        imageCursor?.use { c ->
            var count = 0
            val nameIdx = c.getColumnIndexOrThrow(MediaStore.MediaColumns.DISPLAY_NAME)
            val sizeIdx = c.getColumnIndexOrThrow(MediaStore.MediaColumns.SIZE)
            val mimeIdx = c.getColumnIndexOrThrow(MediaStore.MediaColumns.MIME_TYPE)
            val idIdx = c.getColumnIndexOrThrow(MediaStore.MediaColumns._ID)

            while (c.moveToNext() && count < limit) {
                val obj = JSONObject().apply {
                    put("file_name", c.getString(nameIdx) ?: "Photo.jpg")
                    put("file_path", "content://media/external/images/media/${c.getLong(idIdx)}")
                    put("file_type", "image")
                    put("file_size_bytes", c.getLong(sizeIdx))
                    put("mime_type", c.getString(mimeIdx) ?: "image/jpeg")
                }
                array.put(obj)
                count++
            }
        }

        return array.toString()
    }

    fun openFileStream(path: String): InputStream? {
        return try {
            if (path.startsWith("content://")) {
                context.contentResolver.openInputStream(android.net.Uri.parse(path))
            } else {
                File(path).inputStream()
            }
        } catch (e: Exception) {
            null
        }
    }
}
