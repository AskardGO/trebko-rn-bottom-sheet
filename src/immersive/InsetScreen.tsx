import React from 'react';
import {
  Platform,
  requireNativeComponent,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { useImmersiveMode } from './useImmersiveMode';

export interface InsetScreenProps extends ViewProps {
  children?: React.ReactNode;
  /** Apply top padding for the status bar / notch / cutout. Default: true. */
  applyTopInset?: boolean;
  /** Apply bottom padding for the nav bar / home indicator. Default: true. */
  applyBottomInset?: boolean;
}

// RNInsetScreen is a native view on both Android and iOS.
//  • Android (InsetScreenView.kt): measures WindowInsetsCompat and emits
//    'screenInsetsChanged' via DeviceEventEmitter.
//  • iOS (RNInsetScreenManager.mm): overrides safeAreaInsetsDidChange and emits
//    'screenInsetsChanged' via NativeEventEmitter (RNInsetScreenEmitter).
// On other platforms (web, etc.) the native component is unavailable; the
// component falls back to a plain View with no padding.
const NativeInsetScreen =
  Platform.OS === 'android' || Platform.OS === 'ios'
    ? requireNativeComponent<InsetScreenProps>('RNInsetScreen')
    : null;

/**
 * Screen wrapper that automatically applies system-bar insets as padding and
 * broadcasts them to every `BottomSheet` / `useImmersiveMode` in the tree.
 *
 * **Android**: insets are measured natively via `WindowInsetsCompat` —
 * handles immersive mode, edge-to-edge, Android 15+ navigation bar.
 *
 * **iOS**: insets are measured natively via `UIWindow.safeAreaInsets` —
 * handles home indicator, notch, Dynamic Island, iPad bottom bar.
 *
 * Wrap your app root **once**. All `BottomSheet` instances automatically
 * receive the correct `bottomInset` with no additional props.
 *
 * @example
 * ```tsx
 * <GestureHandlerRootView style={{ flex: 1 }}>
 *   <InsetScreen style={{ flex: 1 }}>
 *     <YourApp />
 *   </InsetScreen>
 *
 *   {open && <BottomSheetPicker items={items} onSelect={pick} onClose={close} />}
 * </GestureHandlerRootView>
 * ```
 */
export function InsetScreen({
  applyTopInset = true,
  applyBottomInset = true,
  style,
  children,
  ...rest
}: InsetScreenProps) {
  // Inset values are populated by the native view via the 'screenInsetsChanged'
  // event (DeviceEventEmitter on Android, NativeEventEmitter on iOS).
  const { topInset, bottomInset } = useImmersiveMode();

  const insetStyle: ViewStyle = {
    flex: 1,
    paddingTop: applyTopInset ? topInset : 0,
    paddingBottom: applyBottomInset ? bottomInset : 0,
  };

  if (NativeInsetScreen == null) {
    // Fallback for unsupported platforms — no native inset measurement.
    return (
      <View style={[styles.screen, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    // The native view triggers inset events; the JS inner View applies padding.
    // Splitting the two responsibilities keeps Yoga layout predictable.
    <NativeInsetScreen
      applyTopInset={applyTopInset}
      applyBottomInset={applyBottomInset}
      style={[styles.screen, style]}
      {...rest}
    >
      <View style={insetStyle}>{children}</View>
    </NativeInsetScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
