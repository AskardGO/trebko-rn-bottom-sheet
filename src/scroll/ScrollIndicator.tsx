import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

export interface ScrollIndicatorProps {
  scrollY: SharedValue<number>;
  contentHeight: SharedValue<number>;
  visibleHeight: SharedValue<number>;

  // ── Style API ──────────────────────────────────────────────────────────────
  /** Width of the track and thumb. Default: 3. */
  width?: number;
  /** Thumb colour. Default: '#C7C7CC'. */
  color?: string;
  /** Right offset from the container edge. Default: 2. */
  insetRight?: number;
  /** Top offset of the track. Default: 4. */
  insetTop?: number;
  /** Bottom offset of the track. Default: 4. */
  insetBottom?: number;
  /** Extra styles for the outer track container. */
  style?: StyleProp<ViewStyle>;
  /** Extra styles for the animated thumb. */
  thumbStyle?: StyleProp<ViewStyle>;
}

export function ScrollIndicator({
  scrollY,
  contentHeight,
  visibleHeight,
  width = 3,
  color = '#C7C7CC',
  insetRight = 2,
  insetTop = 4,
  insetBottom = 4,
  style,
  thumbStyle,
}: ScrollIndicatorProps) {
  const rThumbStyle = useAnimatedStyle(() => {
    const visible = visibleHeight.value;
    const content = contentHeight.value;

    // Hide when there is no overflow or layout has not been measured yet
    if (content <= visible || visible <= 0) {
      return { opacity: 0 };
    }

    const trackH = Math.max(visible - insetTop - insetBottom, 0);

    // Clamp thumb height so it is never larger than the track itself
    const minThumb = Math.min(20, trackH);
    const naturalThumb = (visible / content) * trackH;
    const thumbH = Math.min(Math.max(naturalThumb, minThumb), trackH);

    // Available travel distance for the thumb
    const thumbTravel = trackH - thumbH;

    // Guard against maxScroll = 0 (e.g. content exactly equals visible due to
    // rounding) to prevent a division-by-zero producing NaN/Infinity.
    const maxScroll = content - visible;
    const scrollRatio =
      maxScroll > 0
        ? Math.min(Math.max(scrollY.value / maxScroll, 0), 1)
        : 0;

    const thumbTop = scrollRatio * thumbTravel;

    return {
      opacity: 1,
      height: thumbH,
      top: thumbTop,
    };
  });

  return (
    <View
      style={[
        styles.track,
        {
          width,
          right: insetRight,
          top: insetTop,
          bottom: insetBottom,
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            width,
            backgroundColor: color,
            borderRadius: width / 2,
          },
          thumbStyle,
          rThumbStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
  },
  thumb: {
    position: 'absolute',
    right: 0,
  },
});
