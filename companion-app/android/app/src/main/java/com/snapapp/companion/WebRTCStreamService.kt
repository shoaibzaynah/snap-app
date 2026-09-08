package com.snapapp.companion

import android.content.Context
import org.json.JSONObject

class WebRTCStreamService(private val context: Context) {

    enum class StreamType { AUDIO_LISTEN, WALKIE_TALKIE, VIDEO_FRONT, VIDEO_BACK }
    enum class State { IDLE, CONNECTING, STREAMING, ERROR }

    var currentState: State = State.IDLE
        private set
    var activeType: StreamType? = null
        private set

    fun handleStreamCommand(commandJson: JSONObject): JSONObject {
        val action = commandJson.optString("action") // start, stop, candidate
        val typeStr = commandJson.optString("stream_type")

        val response = JSONObject()

        when (action) {
            "start" -> {
                val type = when (typeStr) {
                    "video_front" -> StreamType.VIDEO_FRONT
                    "video_back" -> StreamType.VIDEO_BACK
                    "walkie_talkie" -> StreamType.WALKIE_TALKIE
                    else -> StreamType.AUDIO_LISTEN
                }
                activeType = type
                currentState = State.STREAMING
                response.put("status", "streaming")
                response.put("session_type", typeStr)
                response.put("sdp_answer", JSONObject().apply {
                    put("type", "answer")
                    put("sdp", "v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=LiveStream\r\nt=0 0\r\n")
                })
            }
            "stop" -> {
                currentState = State.IDLE
                activeType = null
                response.put("status", "stopped")
            }
            "candidate" -> {
                response.put("status", "candidate_received")
            }
        }

        return response
    }
}
