package com.rnbottomsheetexample

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.rnbottomsheet.ImmersiveModule

class MainActivity : ReactActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)
    }

    /**
     * Android resets the navigation bar whenever the window regains focus
     * (e.g. after a dialog, a permission prompt, or the dev menu closes).
     * Delegating to ImmersiveModule.reapplyIfNeeded keeps the mode sticky.
     */
    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) ImmersiveModule.reapplyIfNeeded(this)
    }

    override fun getMainComponentName(): String = "RnBottomSheetExample"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
