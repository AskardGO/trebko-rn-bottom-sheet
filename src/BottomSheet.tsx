import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from 'react';
import {
  Dimensions,
  View,
  StyleSheet,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { BottomSheetProps, BottomSheetMethods } from './types';
import { BottomSheetContext } from './BottomSheetContext';
import { useImmersiveMode } from './useImmersiveMode';
import { resolveSize, INITIAL_SCREEN_HEIGHT } from './utils';

// handle paddingTop(12) + handle(4) + paddingBottom(8) + gap(8) = 32
const HANDLE_AREA = 32;
// paddingBottom on the sheet container
const CHROME_PADDING = 16;
const MIN_CONTENT_HEIGHT = 40;
// Extra pixels the sheet extends below the keyboard top.
// Eliminates the gap between keyboard and sheet during keyboard animation.
const KEYBOARD_OVERLAP = 100;
// Extra pixels the sheet VIEW extends below the screen bottom (invisible).
// Covers the spring-bounce gap when the sheet opens with a lively animation.
const BOTTOM_OVERFLOW = 80;

// Open: lively spring with a small natural overshoot
const OPEN_SPRING = { damping: 14, stiffness: 150, mass: 0.9 };
// Close: ease-out cubic, slightly faster than the open
const CLOSE_DURATION = 260;
const CLOSE_EASING = Easing.out(Easing.cubic);

export const BottomSheet = forwardRef<BottomSheetMethods, BottomSheetProps>(
  (
    {
      children,
      initialSnapPointIndex = 0,
      snapPoints,
      dynamicSizing,
      maxHeight = '90%',
      contentHeight: contentHeightProp,
      headerComponent,
      enableBackdrop = true,
      backdropOpacity = 0.5,
      enablePanDownToClose = true,
      enableKeyboardAvoid = true,
      enableHandlePanningGesture = true,
      bottomInset: bottomInsetProp,
      isImmersive: isImmersiveProp,
      navBarHeight: navBarHeightProp,  // stored separately so the hook value becomes the default
      onChange,
      onClose,
      animationConfigs = {},
      animatedPosition: externalPosition,
      animatedIndex: externalIndex,
      style,
      ...props
    },
    ref
  ) => {
    // Read immersive state and insets from the module-level hook.
    // Explicit props take precedence (allowing per-sheet overrides on iOS etc.).
    const {
      isImmersive: hookIsImmersive,
      bottomInset: hookBottomInset,
      navBarHeight: hookNavBarHeight,
    } = useImmersiveMode();
    const isImmersive = isImmersiveProp ?? hookIsImmersive;
    const bottomInset = bottomInsetProp ?? hookBottomInset;
    const navBarHeight = navBarHeightProp ?? hookNavBarHeight;

    // Reactive screen height — updates automatically on rotation, immersive mode
    // toggle, multi-window resize, or any other window dimension change.
    const { height: screenHeight } = useWindowDimensions();

    // Physical screen height — hardware constant, never changes.
    const physScreenH = useMemo(() => Dimensions.get('screen').height, []);

    // When immersive mode is active the navigation bar is hidden and the window
    // fills the full physical screen. However, useWindowDimensions() can still
    // return the pre-immersive height until the native didUpdateDimensions event
    // arrives. Using physScreenH directly prevents the white gap / overflow that
    // appears at the bottom right after the nav bar is hidden.
    const effectiveScreenH = isImmersive ? physScreenH : screenHeight;

    // Apply the bottom inset only in edge-to-edge mode (window fills physScreenH).
    const effectiveBottomInset = effectiveScreenH >= physScreenH - 5 ? bottomInset : 0;

    const isDynamicSizing = dynamicSizing ?? snapPoints === undefined;

    const maxHeightPx = useMemo(
      () => resolveSize(maxHeight, effectiveScreenH, effectiveScreenH * 0.9),
      [maxHeight, effectiveScreenH]
    );

    const snapPointsPixels = useMemo(() => {
      if (isDynamicSizing || !snapPoints) return [];
      return snapPoints.map((p) => resolveSize(p, effectiveScreenH, effectiveScreenH * 0.5));
    }, [snapPoints, isDynamicSizing, effectiveScreenH]);

    const [measuredHeight, setMeasuredHeight] = useState(0);
    const [headerHeight, setHeaderHeight] = useState(0);
    const [activeSnapIndex, setActiveSnapIndex] = useState(initialSnapPointIndex);
    // Tracks whether the sheetHeight resize effect has run at least once.
    // Has its own independent flag so it is not affected by the order in which
    // sibling effects fire during the same React commit (which caused the mount
    // spring to be immediately overridden by a second spring in the resize effect).
    const isFirstHeightChange = useRef(true);

    const sheetHeight = useMemo(() => {
      if (!isDynamicSizing) {
        return (
          snapPointsPixels[activeSnapIndex] ??
          snapPointsPixels[0] ??
          maxHeightPx
        );
      }
      const raw = contentHeightProp ?? measuredHeight ?? maxHeightPx * 0.4;
      return Math.min(Math.max(raw, 120), maxHeightPx);
    }, [
      isDynamicSizing,
      contentHeightProp,
      measuredHeight,
      maxHeightPx,
      snapPointsPixels,
      activeSnapIndex,
    ]);

    // ── SharedValues ──────────────────────────────────────────────────────────
    // Seed with INITIAL_SCREEN_HEIGHT so the sheet is off-screen from frame 1,
    // even before the first useWindowDimensions render fires.
    const translateY = useSharedValue(INITIAL_SCREEN_HEIGHT);
    const context = useSharedValue({ y: 0 });
    // Mirrors effectiveScreenH on the UI thread so worklets stay in sync
    // when dimensions change (immersive mode, rotation, multi-window).
    const screenHeightSV = useSharedValue(effectiveScreenH);
    // Tracks the previous effectiveScreenH to detect genuine runtime dimension
    // changes vs. the initial render.
    const prevScreenHeightRef = useRef(effectiveScreenH);
    const currentIndex = useSharedValue(initialSnapPointIndex);
    // These mirror JS state so worklets can read them without closures
    const keyboardHeightSV = useSharedValue(0);
    // Height to reserve at the bottom of the content wrapper when
    // isImmersive && keyboard open (nav bar reappears below the keyboard).
    const navBarReserveSV = useSharedValue(0);
    const isImmersiveSV = useSharedValue(isImmersive);
    const headerHeightSV = useSharedValue(0);
    const sheetHeightSV = useSharedValue(sheetHeight);
    const maxHeightPxSV = useSharedValue(maxHeightPx);
    const bottomInsetSV = useSharedValue(effectiveBottomInset);

    const position = externalPosition || translateY;
    const index = externalIndex || currentIndex;

    // Sync JS state → SharedValues (non-animated; these don't drive layout directly)
    useEffect(() => {
      headerHeightSV.value = headerHeight;
    }, [headerHeight, headerHeightSV]);

    useEffect(() => {
      maxHeightPxSV.value = maxHeightPx;
    }, [maxHeightPx, maxHeightPxSV]);

    useEffect(() => {
      bottomInsetSV.value = effectiveBottomInset;
    }, [effectiveBottomInset, bottomInsetSV]);

    useEffect(() => {
      isImmersiveSV.value = isImmersive;
    }, [isImmersive, isImmersiveSV]);

    // Keep UI-thread screenHeight in sync with the effective screen height.
    // effectiveScreenH = physScreenH when immersive, else useWindowDimensions().
    // This covers immersive mode, gesture nav bar toggling, rotation, and
    // Android multi-window resize events without any additional listeners.
    useEffect(() => {
      const prevH = prevScreenHeightRef.current;
      prevScreenHeightRef.current = effectiveScreenH;

      // Always sync the shared value — used in animated style worklets.
      screenHeightSV.value = effectiveScreenH;

      // Only reposition when the effective height genuinely changes at runtime.
      // On the initial render prevH === effectiveScreenH, so we skip this branch
      // and let the mount effect handle the opening spring animation instead.
      if (prevH === effectiveScreenH) return;

      // Screen size changed (rotation, immersive mode, multi-window).
      // Instantly snap the sheet to stay within the new bounds.
      if (isDynamicSizing) {
        position.value = effectiveScreenH - sheetHeightSV.value;
      } else if (snapPointsPixels.length > 0) {
        // Re-anchor the current snap point at the new screen height.
        const clampedIdx = Math.min(
          Math.max(activeSnapIndex, 0),
          snapPointsPixels.length - 1
        );
        position.value = effectiveScreenH - snapPointsPixels[clampedIdx]!;
      }
    }, [effectiveScreenH, screenHeightSV, sheetHeightSV, isDynamicSizing, snapPointsPixels, activeSnapIndex, position]);

    // ── Keyboard ──────────────────────────────────────────────────────────────
    // When isImmersive + keyboard opens, the nav bar reappears at the bottom of
    // the screen. Add paddingBottom = navBarHeight to scroll views so the last
    // list item is not hidden behind the nav bar.
    // navBarReserveJS is passed via context as paddingBottom on BottomSheetFlatList.
    const [navBarReserveJS, setNavBarReserveJS] = useState(0);

    useEffect(() => {
      if (!enableKeyboardAvoid) return;

      const show = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        (e) => {
          const duration = Platform.OS === 'ios' ? e.duration : 220;
          keyboardHeightSV.value = withTiming(e.endCoordinates.height, {
            duration,
            easing: Easing.out(Easing.cubic),
          });
          if (isImmersiveSV.value) {
            const h = navBarHeight;
            navBarReserveSV.value = h;
            setNavBarReserveJS(h);
          }
        }
      );
      const hide = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => {
          const duration = Platform.OS === 'ios' ? 250 : 180;
          keyboardHeightSV.value = withTiming(0, {
            duration,
            easing: Easing.out(Easing.cubic),
          });
          navBarReserveSV.value = 0;
          setNavBarReserveJS(0);
        }
      );
      return () => {
        show.remove();
        hide.remove();
      };
    }, [
      enableKeyboardAvoid,
      keyboardHeightSV,
      navBarReserveSV,
      isImmersiveSV,
      navBarHeight,
    ]);

    // ── Spring / timing config ────────────────────────────────────────────────
    // withSpring and withTiming accept incompatible config shapes, so we split
    // them here. If the caller provides `duration` we switch to withTiming.
    const springConfig = useMemo(
      () => ({
        damping: animationConfigs.damping ?? OPEN_SPRING.damping,
        stiffness: animationConfigs.stiffness ?? OPEN_SPRING.stiffness,
        mass: animationConfigs.mass ?? OPEN_SPRING.mass,
      }),
      [animationConfigs]
    );

    const timingConfig = useMemo(
      () =>
        animationConfigs.duration
          ? {
              duration: animationConfigs.duration,
              easing: animationConfigs.easing,
            }
          : null,
      [animationConfigs]
    );

    // ── Core actions ──────────────────────────────────────────────────────────
    const notifySnapChange = useCallback(
      (snapIndex: number) => {
        setActiveSnapIndex(snapIndex);
        onChange?.(snapIndex);
      },
      [onChange]
    );

    const animateToHeight = useCallback(
      (height: number, snapIndex?: number) => {
        const dest = effectiveScreenH - height;
        const cb = (finished?: boolean) => {
          if (finished && snapIndex !== undefined) {
            index.value = snapIndex;
            runOnJS(notifySnapChange)(snapIndex);
          }
        };
        if (timingConfig) {
          position.value = withTiming(dest, timingConfig, cb);
        } else {
          position.value = withSpring(dest, springConfig, cb);
        }
      },
      [effectiveScreenH, position, index, notifySnapChange, springConfig, timingConfig]
    );

    const snapToIndex = useCallback(
      (snapIndex: number) => {
        if (isDynamicSizing) {
          animateToHeight(sheetHeight, 0);
          return;
        }
        if (snapPointsPixels.length === 0) return;
        // Clamp to valid range so an out-of-bounds initialSnapPointIndex
        // still opens the sheet at the nearest valid position.
        const clampedIndex = Math.min(
          Math.max(snapIndex, 0),
          snapPointsPixels.length - 1
        );
        animateToHeight(snapPointsPixels[clampedIndex]!, clampedIndex);
      },
      [isDynamicSizing, sheetHeight, snapPointsPixels, animateToHeight]
    );

    const close = useCallback(() => {
      position.value = withTiming(
        effectiveScreenH,
        { duration: CLOSE_DURATION, easing: CLOSE_EASING },
        (finished) => {
          if (finished && onClose) runOnJS(onClose)();
        }
      );
    }, [effectiveScreenH, position, onClose]);

    // ── Handle pan — ONLY the handle drag moves / closes the sheet ────────────
    const handlePanGesture = useMemo(() => {
      if (!enableHandlePanningGesture) return Gesture.Pan().enabled(false);

      if (isDynamicSizing) {
        return Gesture.Pan()
          .onStart(() => {
            context.value = { y: position.value };
          })
          .onUpdate((event) => {
            const nextY = context.value.y + event.translationY;
            // Dynamic sizing: the sheet sits at its natural height so the only
            // allowed drag direction is downward (to close). Clamping to the
            // sheet's natural top position prevents upward dragging, which also
            // implicitly enforces the maxHeight constraint since sheetHeight ≤ maxHeight.
            position.value = Math.max(
              nextY,
              screenHeightSV.value - sheetHeightSV.value
            );
          })
          .onEnd((event) => {
            const draggedDown =
              position.value > screenHeightSV.value - sheetHeightSV.value + 80;
            const shouldClose =
              enablePanDownToClose &&
              (event.velocityY > 500 || draggedDown);

            if (shouldClose) runOnJS(close)();
            else runOnJS(animateToHeight)(sheetHeightSV.value);
          });
      }

      // Snap-mode pan: guard against empty snapPointsPixels
      if (snapPointsPixels.length === 0) return Gesture.Pan().enabled(false);

      return Gesture.Pan()
        .onStart(() => {
          context.value = { y: position.value };
        })
        .onUpdate((event) => {
          position.value = context.value.y + event.translationY;
          const maxH = snapPointsPixels[snapPointsPixels.length - 1]!;
          const minY = screenHeightSV.value - maxH;
          if (position.value < minY) position.value = minY;
        })
        .onEnd((event) => {
          const currentH = screenHeightSV.value - position.value;
          let closestIdx = 0;
          let closestDist = Math.abs(currentH - snapPointsPixels[0]!);
          for (let i = 1; i < snapPointsPixels.length; i++) {
            const d = Math.abs(currentH - snapPointsPixels[i]!);
            if (d < closestDist) {
              closestDist = d;
              closestIdx = i;
            }
          }
          const shouldClose =
            enablePanDownToClose &&
            closestIdx === 0 &&
            (event.velocityY > 500 ||
              position.value > screenHeightSV.value - snapPointsPixels[0]! + 80);

          if (shouldClose) runOnJS(close)();
          else runOnJS(snapToIndex)(closestIdx);
        });
    }, [
      enableHandlePanningGesture,
      isDynamicSizing,
      sheetHeightSV,
      snapPointsPixels,
      screenHeightSV,
      position,
      context,
      enablePanDownToClose,
      close,
      animateToHeight,
      snapToIndex,
    ]);

    // ── Animated styles ────────────────────────────────────────────────────────
    // Design principle: the maxHeight constraint is enforced by the GESTURE
    // handler (user cannot drag above it), NOT by the animated style.
    // This lets spring animations freely overshoot for a natural bounce feel.
    //
    // The ONLY style-level clamp is:
    //   • When the keyboard is present: clamp to `minY` so the sheet never
    //     disappears off the top of the screen while being lifted by the IME.
    //   • Without keyboard: clamp to y=0 (screen edge) as a hard safety net.
    const rSheetStyle = useAnimatedStyle(() => {
      const sh = screenHeightSV.value;
      const kb = keyboardHeightSV.value;
      const overlap = Math.min(kb, KEYBOARD_OVERLAP);
      const minY = sh - maxHeightPxSV.value;
      const naturalY = position.value - kb;

      // With keyboard: clamp so the sheet stays below the status bar.
      // Without keyboard: only prevent going above the very top of the screen,
      // allowing the spring to bounce freely through the maxHeight boundary.
      const clampedY = kb > 0 ? Math.max(naturalY, minY) : Math.max(naturalY, 0);
      const clamped = kb > 0 && naturalY < minY;

      if (isDynamicSizing) {
        const height = clamped
          ? Math.max(
              sh - kb + overlap - clampedY + BOTTOM_OVERFLOW,
              HANDLE_AREA + CHROME_PADDING
            )
          : sheetHeightSV.value + overlap + BOTTOM_OVERFLOW;
        return {
          transform: [{ translateY: clampedY }],
          height,
        };
      }
      return {
        transform: [{ translateY: clampedY }],
        height: sh,
      };
    });

    // Content wrapper: clips the list to the visible area above the keyboard.
    const rContentWrapperStyle = useAnimatedStyle(() => {
      const sh = screenHeightSV.value;
      const kb = keyboardHeightSV.value;
      const chrome = HANDLE_AREA + headerHeightSV.value + CHROME_PADDING;
      const minY = sh - maxHeightPxSV.value;
      const naturalY = position.value - kb;
      const clampedY = kb > 0 ? Math.max(naturalY, minY) : Math.max(naturalY, 0);
      const visibleSheetH = sh - kb - clampedY;
      return {
        height: Math.max(visibleSheetH - chrome, MIN_CONTENT_HEIGHT),
      };
    });

    // Backdrop: driven DIRECTLY from position.value — perfectly synchronous.
    // No withTiming wrapper; spring on position already provides smooth opacity.
    const rBackdropStyle = useAnimatedStyle(() => {
      const sh = screenHeightSV.value;
      const maxH =
        isDynamicSizing
          ? sheetHeightSV.value
          : snapPointsPixels.length > 0
          ? snapPointsPixels[snapPointsPixels.length - 1]
          : sh;
      const visibleH = sh - position.value;
      const progress = Math.min(Math.max(visibleH / maxH, 0), 1);
      return { opacity: progress * backdropOpacity };
    });

    // ── Open animation on mount ───────────────────────────────────────────────
    useEffect(() => {
      // sheetHeightSV is already initialised to sheetHeight (correct visual size).
      // We only need to animate position.value from off-screen to the target.
      if (isDynamicSizing) {
        animateToHeight(sheetHeight, 0);
      } else {
        snapToIndex(initialSnapPointIndex);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Animate sheet resize when content height changes (dynamic mode only) ──
    // Fires every time sheetHeight changes AFTER the initial mount.
    // Uses its own `isFirstHeightChange` ref instead of `isFirstMount` because
    // both effects fire in the same React commit on mount — a shared flag would
    // be set to false by the mount effect before this one gets to check it,
    // causing a redundant spring that fights the opening animation.
    useEffect(() => {
      if (isFirstHeightChange.current) {
        // Skip on first render; the mount effect above handles the opening spring.
        isFirstHeightChange.current = false;
        return;
      }
      if (!isDynamicSizing) return;
      // Animate size and position atomically: bottom edge = position + height = effectiveScreenH
      if (timingConfig) {
        position.value = withTiming(effectiveScreenH - sheetHeight, timingConfig);
        sheetHeightSV.value = withTiming(sheetHeight, timingConfig);
      } else {
        position.value = withSpring(effectiveScreenH - sheetHeight, springConfig);
        sheetHeightSV.value = withSpring(sheetHeight, springConfig);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sheetHeight]);

    useImperativeHandle(ref, () => ({
      snapToIndex,
      snapToPosition: (p) => {
        if (timingConfig) {
          position.value = withTiming(effectiveScreenH - p, timingConfig);
        } else {
          position.value = withSpring(effectiveScreenH - p, springConfig);
        }
      },
      expand: () =>
        isDynamicSizing
          ? animateToHeight(sheetHeight, 0)
          : snapToIndex(snapPointsPixels.length - 1),
      collapse: () =>
        isDynamicSizing
          ? animateToHeight(sheetHeight, 0)
          : snapToIndex(0),
      close,
    }));

    const handleContentLayout = useCallback(
      (event: { nativeEvent: { layout: { height: number } } }) => {
        if (contentHeightProp !== undefined) return;
        const h =
          event.nativeEvent.layout.height + HANDLE_AREA + CHROME_PADDING + effectiveBottomInset;
        setMeasuredHeight((prev) => (Math.abs(prev - h) > 1 ? h : prev));
      },
      [contentHeightProp, effectiveBottomInset]
    );

    const handleHeaderLayout = useCallback(
      (event: { nativeEvent: { layout: { height: number } } }) => {
        setHeaderHeight(event.nativeEvent.layout.height);
      },
      []
    );

    // Memoize context value to avoid re-rendering all scroll consumers on every
    // BottomSheet render. Only updates when relevant values change.
    const contentScrollEnabled =
      isDynamicSizing ||
      activeSnapIndex === Math.max(snapPointsPixels.length - 1, 0);
    // bottomInset: normal nav bar padding (non-immersive) +
    //             nav bar reserve while keyboard is open in immersive mode.
    const contextValue = useMemo(
      () => ({
        contentScrollEnabled,
        bottomInset: effectiveBottomInset + navBarReserveJS,
      }),
      [contentScrollEnabled, effectiveBottomInset, navBarReserveJS]
    );

    // ── Render ─────────────────────────────────────────────────────────────────
    // No Modal. Renders as absoluteFill overlay in the parent's layout layer.
    // pointerEvents="box-none" → touches pass through the transparent container
    // to the content beneath, but are captured by the backdrop / sheet children.
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <BottomSheetContext.Provider value={contextValue}>
          {enableBackdrop && (
            <TouchableWithoutFeedback
              onPress={enablePanDownToClose ? close : undefined}
            >
              <Animated.View style={[styles.backdrop, rBackdropStyle]} />
            </TouchableWithoutFeedback>
          )}

          <Animated.View style={[styles.sheet, rSheetStyle, style]} {...props}>
            {/* Drag area: ONLY the handle moves the sheet */}
            <GestureDetector gesture={handlePanGesture}>
              <View style={styles.handleArea}>
                <View style={styles.handle} />
              </View>
            </GestureDetector>

            {headerComponent ? (
              <View style={styles.header} onLayout={handleHeaderLayout}>
                {headerComponent}
              </View>
            ) : null}

            {/* Content wrapper: height animates to stay above keyboard */}
            <Animated.View
              style={[styles.contentWrapper, rContentWrapperStyle]}
              onLayout={isDynamicSizing ? handleContentLayout : undefined}
            >
              {children}
            </Animated.View>
          </Animated.View>
        </BottomSheetContext.Provider>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
  },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  handleArea: {
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  header: {
    marginBottom: 8,
  },
  contentWrapper: {
    overflow: 'hidden',
  },
});
