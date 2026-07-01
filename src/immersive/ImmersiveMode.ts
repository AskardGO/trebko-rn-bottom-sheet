import { NativeModules, Platform } from 'react-native';

const { ImmersiveMode, RNInsetScreenEmitter } = NativeModules as {
  ImmersiveMode?: {
    setImmersive(enabled: boolean): void;
    getBottomInset(): Promise<number>;
    getTopInset(): Promise<number>;
  };
  RNInsetScreenEmitter?: {
    getBottomInset(): Promise<number>;
    getTopInset(): Promise<number>;
  };
};

/**
 * Hides or shows the Android navigation bar (bottom immersive mode).
 * The bar can be temporarily revealed with a swipe gesture.
 * No-op on iOS or when the native module is unavailable.
 */
export function setImmersiveMode(enabled: boolean): void {
  if (Platform.OS === 'android') {
    ImmersiveMode?.setImmersive(enabled);
  }
}

/**
 * Returns the bottom system inset in logical pixels:
 * - Android: hardware navigation-bar height (uses `getInsetsIgnoringVisibility`
 *   so it stays non-zero even when the bar is hidden in immersive mode).
 * - iOS: `UIWindow.safeAreaInsets.bottom` — home indicator / iPad bottom bar.
 * Resolves to 0 when the module is unavailable.
 */
export function getBottomInset(): Promise<number> {
  if (Platform.OS === 'android' && ImmersiveMode?.getBottomInset) {
    return ImmersiveMode.getBottomInset();
  }
  if (Platform.OS === 'ios' && RNInsetScreenEmitter?.getBottomInset) {
    return RNInsetScreenEmitter.getBottomInset();
  }
  return Promise.resolve(0);
}

/**
 * Returns the top system inset in logical pixels:
 * - Android: status-bar height including display cutouts.
 * - iOS: `UIWindow.safeAreaInsets.top` — notch / Dynamic Island / status bar.
 * Resolves to 0 when the module is unavailable.
 */
export function getTopInset(): Promise<number> {
  if (Platform.OS === 'android' && ImmersiveMode?.getTopInset) {
    return ImmersiveMode.getTopInset();
  }
  if (Platform.OS === 'ios' && RNInsetScreenEmitter?.getTopInset) {
    return RNInsetScreenEmitter.getTopInset();
  }
  return Promise.resolve(0);
}

/** True on Android when the ImmersiveMode native module is linked. */
export const isImmersiveModeSupported =
  Platform.OS === 'android' && !!ImmersiveMode;
