import React, { forwardRef, useCallback } from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import type { FlatListProps } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useBottomSheetContext } from './BottomSheetContext';
import {
  ScrollIndicator,
  type ScrollIndicatorProps,
} from './ScrollIndicator';

/** Props for {@link BottomSheetFlatList}. Extends RN `FlatListProps<T>` (hitSlop omitted for GH compat). */
export interface BottomSheetFlatListProps<T> extends Omit<FlatListProps<T>, 'hitSlop'> {
  /**
   * Render the custom scroll indicator track and thumb.
   * Set to `false` to fall back to the platform-native scroll indicator.
   * Default: `true`.
   */
  showsCustomScrollIndicator?: boolean;
  /** Fine-tune the custom scroll indicator's appearance. */
  scrollIndicatorProps?: Omit<
    ScrollIndicatorProps,
    'scrollY' | 'contentHeight' | 'visibleHeight'
  >;
}

// Inner component (not generic-forwardRef-friendly), cast outside
function BottomSheetFlatListInner<T>(
  {
    scrollEnabled,
    style,
    contentContainerStyle,
    showsCustomScrollIndicator = true,
    scrollIndicatorProps,
    onScroll,
    onContentSizeChange,
    onLayout,
    ...props
  }: BottomSheetFlatListProps<T>,
  ref: React.Ref<FlatList<T>>
) {
  const { contentScrollEnabled, bottomInset } = useBottomSheetContext();

  const scrollY = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const visibleHeight = useSharedValue(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = event.nativeEvent.contentOffset.y;
      onScroll?.(event);
    },
    [scrollY, onScroll]
  );

  const handleContentSizeChange = useCallback(
    (w: number, h: number) => {
      contentHeight.value = h;
      onContentSizeChange?.(w, h);
    },
    [contentHeight, onContentSizeChange]
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      visibleHeight.value = event.nativeEvent.layout.height;
      onLayout?.(event);
    },
    [visibleHeight, onLayout]
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={ref as any}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={!showsCustomScrollIndicator}
        scrollEnabled={contentScrollEnabled && scrollEnabled !== false}
        style={[{ flex: 1 }, style]}
        contentContainerStyle={[
          bottomInset > 0 ? { paddingBottom: bottomInset } : null,
          contentContainerStyle,
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        {...props}
      />
      {showsCustomScrollIndicator && (
        <ScrollIndicator
          scrollY={scrollY}
          contentHeight={contentHeight}
          visibleHeight={visibleHeight}
          {...scrollIndicatorProps}
        />
      )}
    </View>
  );
}

export const BottomSheetFlatList = forwardRef(BottomSheetFlatListInner) as <T>(
  props: BottomSheetFlatListProps<T> & { ref?: React.Ref<FlatList<T>> }
) => React.ReactElement;
