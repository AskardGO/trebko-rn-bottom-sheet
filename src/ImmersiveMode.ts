import { NativeModules, Platform } from 'react-native';

const { ImmersiveMode } = NativeModules as {
  ImmersiveMode?: {
    setImmersive(enabled: boolean): void;
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
 * Returns the hardware navigation-bar height in dp.
 * Uses `getInsetsIgnoringVisibility` so it always returns the physical height
 * even when the bar is currently hidden.
 * Resolves to 0 on iOS or when the module is unavailable.
 */
export function getBottomInset(): Promise<number> {
  if (Platform.OS === 'android' && ImmersiveMode?.getBottomInset) {
    return ImmersiveMode.getBottomInset();
  }
  return Promise.resolve(0);
}

/**
 * Returns the hardware status-bar height in dp, including display cutouts
 * (notches, punch-hole cameras). Use this as `paddingTop` when the window
 * extends behind the status bar (edge-to-edge or immersive mode active).
 * Resolves to 0 on iOS or when the module is unavailable.
 */
export function getTopInset(): Promise<number> {
  if (Platform.OS === 'android' && ImmersiveMode?.getTopInset) {
    return ImmersiveMode.getTopInset();
  }
  return Promise.resolve(0);
}

/** True on Android when the ImmersiveMode native module is linked. */
export const isImmersiveModeSupported =
  Platform.OS === 'android' && !!ImmersiveMode;
