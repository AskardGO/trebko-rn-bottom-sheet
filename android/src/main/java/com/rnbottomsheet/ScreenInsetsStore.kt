package com.rnbottomsheet

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext

/**
 * Latest visible system-bar insets (dp) measured by [InsetScreenView].
 * Shared with [ImmersiveModule] so JS hooks can read values without prop drilling.
 */
object ScreenInsetsStore {
    var topInsetDp: Float = 0f
        private set
    var bottomInsetDp: Float = 0f
        private set

    fun update(context: ReactApplicationContext?, topDp: Float, bottomDp: Float) {
        if (topInsetDp == topDp && bottomInsetDp == bottomDp) return
        topInsetDp = topDp
        bottomInsetDp = bottomDp
        if (context == null) return
        try {
            val payload = Arguments.createMap().apply {
                putDouble("top", topDp.toDouble())
                putDouble("bottom", bottomDp.toDouble())
            }
            context.emitDeviceEvent("screenInsetsChanged", payload)
        } catch (_: Exception) {
            // Bridge may be torn down.
        }
    }
}
