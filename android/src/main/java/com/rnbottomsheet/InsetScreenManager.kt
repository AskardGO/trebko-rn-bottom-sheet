package com.rnbottomsheet

import com.facebook.react.uimanager.LayoutShadowNode
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

/**
 * ViewManager for [InsetScreenView] — the native screen wrapper that owns
 * top/bottom inset calculations.
 *
 * Must extend [ViewGroupManager] so React Native mounts JS children inside the
 * native [InsetScreenView] (a [FrameLayout]). [SimpleViewManager] would leave
 * the wrapper empty and padding would not affect app content.
 */
class InsetScreenManager : ViewGroupManager<InsetScreenView>() {

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext): InsetScreenView =
        InsetScreenView(reactContext)

    override fun createShadowNodeInstance(): LayoutShadowNode = LayoutShadowNode()

    override fun getShadowNodeClass(): Class<out LayoutShadowNode> =
        LayoutShadowNode::class.java

    @ReactProp(name = "applyTopInset", defaultBoolean = true)
    fun setApplyTopInset(view: InsetScreenView, value: Boolean) {
        view.applyTopInset = value
    }

    @ReactProp(name = "applyBottomInset", defaultBoolean = true)
    fun setApplyBottomInset(view: InsetScreenView, value: Boolean) {
        view.applyBottomInset = value
    }

    companion object {
        const val REACT_CLASS = "RNInsetScreen"
    }
}
