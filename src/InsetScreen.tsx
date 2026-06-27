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
  /** Apply top padding for the status bar / cutout. Default: true. */
  applyTopInset?: boolean;
  /** Apply bottom padding for the navigation bar when visible. Default: true. */
  applyBottomInset?: boolean;
}

type NativeInsetScreenProps = InsetScreenProps;

const NativeInsetScreen =
  Platform.OS === 'android'
    ? requireNativeComponent<NativeInsetScreenProps>('RNInsetScreen')
    : null;

/**
 * Native Android screen wrapper that applies system-bar insets as padding.
 *
 * Inset values are computed in Kotlin via `WindowInsetsCompat` and broadcast
 * through the `screenInsetsChanged` event (consumed by `useImmersiveMode`).
 * Padding is applied on an inner JS `View` so Yoga layout always respects
 * system-bar insets (custom native ViewGroups can ignore root padding).
 *
 * On iOS this falls back to a plain `View` — use `SafeAreaView` or pass
 * `useSafeAreaInsets().bottom` to sheets manually.
 *
 * @example
 * ```tsx
 * <GestureHandlerRootView style={{ flex: 1 }}>
 *   <InsetScreen style={{ flex: 1 }}>
 *     <AppContent />
 *   </InsetScreen>
 *   <BottomSheet bottomInset={bottomInset} />
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
  const { topInset, bottomInset } = useImmersiveMode();

  const insetStyle: ViewStyle = {
    flex: 1,
    paddingTop: applyTopInset ? topInset : 0,
    paddingBottom: applyBottomInset ? bottomInset : 0,
  };

  if (NativeInsetScreen == null) {
    return (
      <View style={[styles.fallback, insetStyle, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
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
  fallback: { flex: 1 },
});
