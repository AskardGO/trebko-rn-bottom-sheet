package com.rnbottomsheet

import android.content.res.Resources
import androidx.core.view.WindowInsetsCompat

/**
 * Resolves the bottom safe-area inset in px for edge-to-edge windows.
 *
 * On Android 15+ with 3-button navigation, [WindowInsetsCompat.Type.navigationBars]
 * often reports 0 while the bar is still visible (translucent scrim). Use
 * [WindowInsetsCompat.Type.tappableElement] and related types instead.
 */
internal object InsetUtils {

    private val BOTTOM_INSET_TYPES = intArrayOf(
        WindowInsetsCompat.Type.tappableElement(),
        WindowInsetsCompat.Type.navigationBars(),
        WindowInsetsCompat.Type.mandatorySystemGestures(),
        WindowInsetsCompat.Type.systemBars(),
    )

    fun bottomInsetPx(
        insets: WindowInsetsCompat,
        immersive: Boolean,
        applyBottomInset: Boolean,
        resources: Resources,
    ): Int {
        if (!applyBottomInset || immersive) return 0

        var bottom = maxBottomInset(insets, ignoreVisibility = false)
        if (bottom == 0) {
            bottom = maxBottomInset(insets, ignoreVisibility = true)
        }
        if (bottom == 0) {
            bottom = navigationBarHeightPx(resources)
        }
        return bottom
    }

    fun navigationBarHeightPx(resources: Resources): Int {
        val resId = resources.getIdentifier("navigation_bar_height", "dimen", "android")
        return if (resId > 0) resources.getDimensionPixelSize(resId) else 0
    }

    /**
     * Physical nav-bar height regardless of immersive mode or bar visibility.
     *
     * Uses [WindowInsetsCompat.getInsetsIgnoringVisibility] only for types that
     * support it (system bars). [WindowInsetsCompat.Type.tappableElement] and
     * [WindowInsetsCompat.Type.mandatorySystemGestures] throw
     * [IllegalArgumentException] with that API and are intentionally excluded.
     */
    fun hardwareNavigationBarHeightPx(
        insets: WindowInsetsCompat?,
        resources: Resources,
    ): Int {
        if (insets != null) {
            // Only navigationBars() and systemBars() support getInsetsIgnoringVisibility.
            val bottom = maxOf(
                insets.getInsetsIgnoringVisibility(WindowInsetsCompat.Type.navigationBars()).bottom,
                insets.getInsetsIgnoringVisibility(WindowInsetsCompat.Type.systemBars()).bottom,
            )
            if (bottom > 0) return bottom
        }
        return navigationBarHeightPx(resources)
    }

    private fun maxBottomInset(insets: WindowInsetsCompat, ignoreVisibility: Boolean): Int {
        var max = 0
        for (type in BOTTOM_INSET_TYPES) {
            val value = if (ignoreVisibility) {
                // getInsetsIgnoringVisibility only supports system bar types.
                // Wrap in try-catch so unsupported types (tappableElement, etc.)
                // are silently skipped instead of crashing the whole call.
                try {
                    insets.getInsetsIgnoringVisibility(type).bottom
                } catch (_: IllegalArgumentException) {
                    0
                }
            } else {
                insets.getInsets(type).bottom
            }
            if (value > max) max = value
        }
        return max
    }
}
