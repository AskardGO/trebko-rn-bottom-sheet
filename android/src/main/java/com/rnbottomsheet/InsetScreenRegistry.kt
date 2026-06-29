package com.rnbottomsheet

import java.lang.ref.WeakReference

/**
 * Tracks mounted [InsetScreenView] instances so [ImmersiveModule] can force
 * a re-measure after immersive mode or window flags change.
 */
internal object InsetScreenRegistry {
    private val views = mutableSetOf<WeakReference<InsetScreenView>>()

    fun register(view: InsetScreenView) {
        views.add(WeakReference(view))
    }

    fun unregister(view: InsetScreenView) {
        views.removeAll { it.get() == null || it.get() === view }
    }

    fun requestApplyInsetsAll() {
        views.mapNotNull { it.get() }.forEach { it.refreshInsets() }
    }
}
