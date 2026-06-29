package com.rnbottomsheet

import android.app.Activity
import android.util.DisplayMetrics
import android.view.ViewTreeObserver
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class ImmersiveModule(private val ctx: ReactApplicationContext) :
    ReactContextBaseJavaModule(ctx), LifecycleEventListener {

    override fun getName() = "ImmersiveMode"

    init {
        ctx.addLifecycleEventListener(this)
    }

    // ── LifecycleEventListener ────────────────────────────────────────────────
    // Re-apply immersive mode when the React host resumes (covers app
    // backgrounding / foregrounding). For focus-change events caused by dialogs
    // or permission prompts, call ImmersiveModule.reapplyIfNeeded(activity) from
    // the host app's MainActivity.onWindowFocusChanged.

    override fun onHostResume() {
        val activity = reactApplicationContext.currentActivity ?: return
        applyImmersive(activity, _isImmersive)
        activity.window.decorView.post { InsetScreenRegistry.requestApplyInsetsAll() }
    }

    override fun onHostPause() {}

    override fun onHostDestroy() {
        ctx.removeLifecycleEventListener(this)
    }

    // ── React methods ─────────────────────────────────────────────────────────

    @ReactMethod
    fun setImmersive(enabled: Boolean) {
        _isImmersive = enabled
        val activity = reactApplicationContext.currentActivity ?: return
        activity.runOnUiThread {
            applyImmersive(activity, enabled)
            val decorView = activity.window.decorView

            // Attempt 1 — next frame: some devices update Display.getMetrics()
            // immediately after setDecorFitsSystemWindows.
            decorView.post { notifyDimensionsChanged(activity) }

            // Attempt 2 — after layout pass: guaranteed to have final metrics.
            decorView.viewTreeObserver.addOnGlobalLayoutListener(
                object : ViewTreeObserver.OnGlobalLayoutListener {
                    override fun onGlobalLayout() {
                        decorView.viewTreeObserver.removeOnGlobalLayoutListener(this)
                        notifyDimensionsChanged(activity)
                        InsetScreenRegistry.requestApplyInsetsAll()
                    }
                }
            )
            decorView.post { InsetScreenRegistry.requestApplyInsetsAll() }
        }
    }

    /**
     * Returns the hardware navigation-bar height in dp (always the physical
     * height regardless of visibility). Use this on app mount while the bar is
     * still shown; then derive bottomInset = immersive ? 0 : navBarHeight in JS.
     */
    @ReactMethod
    fun getBottomInset(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) { promise.resolve(0.0); return }
        activity.runOnUiThread {
            try {
                val decorView = activity.window.decorView
                val insets = ViewCompat.getRootWindowInsets(decorView)
                val bottomPx = InsetUtils.hardwareNavigationBarHeightPx(
                    insets,
                    activity.resources,
                )
                val density = activity.resources.displayMetrics.density
                promise.resolve(bottomPx / density.toDouble())
            } catch (e: Exception) {
                promise.resolve(0.0)
            }
        }
    }

    /**
     * Returns the hardware status-bar height in dp (always the physical height,
     * including display cutouts / punch-hole cameras). Use this as paddingTop
     * when the window extends behind the status bar (edge-to-edge mode).
     */
    @ReactMethod
    fun getTopInset(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) { promise.resolve(0.0); return }
        activity.runOnUiThread {
            try {
                val decorView = activity.window.decorView
                val insets = ViewCompat.getRootWindowInsets(decorView)
                val status = insets?.getInsetsIgnoringVisibility(
                    WindowInsetsCompat.Type.statusBars()
                )
                val density = activity.resources.displayMetrics.density
                promise.resolve((status?.top ?: 0) / density.toDouble())
            } catch (e: Exception) {
                promise.resolve(0.0)
            }
        }
    }

    // ── Dimension change notification ─────────────────────────────────────────
    // Mirrors React Native's internal formula so useWindowDimensions() gets the
    // correct value after the nav bar is shown / hidden.

    private fun notifyDimensionsChanged(activity: Activity) {
        try {
            @Suppress("DEPRECATION")
            val dm = DisplayMetrics().also {
                activity.windowManager.defaultDisplay.getMetrics(it)
            }
            @Suppress("DEPRECATION")
            val real = DisplayMetrics().also {
                activity.windowManager.defaultDisplay.getRealMetrics(it)
            }
            val density = dm.density
            val fontScale = activity.resources.configuration.fontScale

            fun dimensMap(w: Int, h: Int) = Arguments.createMap().apply {
                putDouble("width", w / density.toDouble())
                putDouble("height", h / density.toDouble())
                putDouble("scale", density.toDouble())
                putDouble("fontScale", fontScale.toDouble())
            }

            val payload = Arguments.createMap().apply {
                putMap("window", dimensMap(dm.widthPixels, dm.heightPixels))
                putMap("screen", dimensMap(real.widthPixels, real.heightPixels))
            }

            ctx.emitDeviceEvent("didUpdateDimensions", payload)
        } catch (_: Exception) {
            // Best-effort — skip if bridge is torn down.
        }
    }

    // ── Companion ─────────────────────────────────────────────────────────────

    companion object {
        /**
         * Current immersive state. Exposed so the host app's MainActivity can
         * call reapplyIfNeeded() from onWindowFocusChanged without needing to
         * track the state independently.
         */
        var _isImmersive = false
            private set

        /** Whether immersive mode is active (nav bar hidden). */
        val isImmersive: Boolean
            get() = _isImmersive

        fun applyImmersive(activity: Activity, enabled: Boolean) {
            val window = activity.window ?: return
            // Stay edge-to-edge; [InsetScreenView] applies padding from window insets.
            WindowCompat.setDecorFitsSystemWindows(window, false)
            val controller = WindowInsetsControllerCompat(window, window.decorView)
            if (enabled) {
                controller.hide(WindowInsetsCompat.Type.navigationBars())
                controller.systemBarsBehavior =
                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            } else {
                controller.show(WindowInsetsCompat.Type.navigationBars())
            }
            window.decorView.post { InsetScreenRegistry.requestApplyInsetsAll() }
        }

        /**
         * Re-applies immersive mode if it is currently active.
         *
         * Call this from the host app's `MainActivity.onWindowFocusChanged`:
         * ```kotlin
         * override fun onWindowFocusChanged(hasFocus: Boolean) {
         *     super.onWindowFocusChanged(hasFocus)
         *     if (hasFocus) ImmersiveModule.reapplyIfNeeded(this)
         * }
         * ```
         * This keeps the nav bar hidden after dialogs, permission prompts, or
         * the dev menu close — events that are not covered by LifecycleEventListener.
         */
        fun reapplyIfNeeded(activity: Activity) {
            applyImmersive(activity, _isImmersive)
        }
    }
}
