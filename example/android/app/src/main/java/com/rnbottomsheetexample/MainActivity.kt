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

    override fun onResume() {
        super.onResume()
        ImmersiveModule.reapplyIfNeeded(this)
    }

    override fun getMainComponentName(): String = "RnBottomSheetExample"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
            override fun onWindowFocusChanged(hasFocus: Boolean) {
                // BridgelessReact raises a soft exception if focus arrives before the
                // ReactContext is created on cold start. Skip until the host is ready.
                if (reactHost?.currentReactContext != null) {
                    super.onWindowFocusChanged(hasFocus)
                }
                if (hasFocus) {
                    ImmersiveModule.reapplyIfNeeded(this@MainActivity)
                }
            }
        }
}
