package com.rnbottomsheet

import android.util.AttributeSet
import android.widget.FrameLayout
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsAnimationCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.uimanager.ThemedReactContext

/**
 * Native root screen wrapper that applies visible system-bar insets as padding.
 *
 * Uses [WindowInsetsCompat.getInsets] (current visibility) so padding automatically
 * reflects immersive mode, keyboard toolbar, and gesture-nav bar changes.
 */
class InsetScreenView @JvmOverloads constructor(
    private val reactContext: ThemedReactContext,
    attrs: AttributeSet? = null,
) : FrameLayout(reactContext, attrs) {

    var applyTopInset: Boolean = true
        set(value) {
            field = value
            refreshInsets()
        }

    var applyBottomInset: Boolean = true
        set(value) {
            field = value
            refreshInsets()
        }

    private val density: Float
        get() = resources.displayMetrics.density

    init {
        clipToPadding = false
        ViewCompat.setOnApplyWindowInsetsListener(this) { _, insets ->
            applyInsets(insets)
            WindowInsetsCompat.CONSUMED
        }
        ViewCompat.setWindowInsetsAnimationCallback(
            this,
            object : WindowInsetsAnimationCompat.Callback(
                WindowInsetsAnimationCompat.Callback.DISPATCH_MODE_CONTINUE_ON_SUBTREE
            ) {
                override fun onProgress(
                    insets: WindowInsetsCompat,
                    runningAnimations: MutableList<WindowInsetsAnimationCompat>,
                ): WindowInsetsCompat {
                    applyInsets(insets)
                    return insets
                }
            },
        )
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        InsetScreenRegistry.register(this)
        refreshInsets()
        // Edge-to-edge insets can arrive after the first layout pass.
        post { refreshInsets() }
    }

    override fun onDetachedFromWindow() {
        InsetScreenRegistry.unregister(this)
        super.onDetachedFromWindow()
    }

    /** Re-read window insets and update padding. Called after immersive toggles. */
    fun refreshInsets() {
        val insets = resolveWindowInsets()
        if (insets != null) {
            applyInsets(insets)
        } else {
            ViewCompat.requestApplyInsets(this)
            reactContext.currentActivity?.window?.decorView?.let {
                ViewCompat.requestApplyInsets(it)
            }
        }
    }

    /**
     * Prefer the activity decor view — RN enables edge-to-edge on the window, and
     * decor insets are available before this view receives its own dispatch.
     */
    private fun resolveWindowInsets(): WindowInsetsCompat? {
        val decorView = reactContext.currentActivity?.window?.decorView
        if (decorView != null) {
            ViewCompat.getRootWindowInsets(decorView)?.let { return it }
        }
        return ViewCompat.getRootWindowInsets(this)
    }

    private fun applyInsets(insets: WindowInsetsCompat) {
        val statusBars = insets.getInsets(
            WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.displayCutout()
        )
        val topPx = if (applyTopInset) statusBars.top else 0
        val bottomPx = InsetUtils.bottomInsetPx(
            insets = insets,
            immersive = ImmersiveModule.isImmersive,
            applyBottomInset = applyBottomInset,
            resources = resources,
        )

        // Yoga layout ignores native setPadding — JS applies padding via style.
        // Keep native padding in sync for any non-RN subviews added later.
        setPadding(paddingLeft, topPx, paddingRight, bottomPx)

        val topDp = topPx / density
        val bottomDp = bottomPx / density
        ScreenInsetsStore.update(reactContext.reactApplicationContext, topDp, bottomDp)
    }
}
