import type { EasingFunction } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import type { ViewProps, ViewStyle, StyleProp } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Primitives

/** A snap-point expressed as an absolute pixel value or a CSS-style percentage string (e.g. `'50%'`). */
export type SnapPoint = number | string;

/** Spring animation configuration passed to `animationConfigs`. */
export interface SpringAnimationConfig {
  /** Spring damping coefficient. Higher = less oscillation. Default: 14. */
  damping?: number;
  /** Spring stiffness. Higher = faster response. Default: 150. */
  stiffness?: number;
  /** Spring mass. Higher = more inertia. Default: 0.9. */
  mass?: number;
}

/** Timing animation configuration passed to `animationConfigs`. */
export interface TimingAnimationConfig {
  /** Animation duration in milliseconds. */
  duration?: number;
  /** Easing function from `react-native-reanimated`. */
  easing?: EasingFunction;
}

/**
 * Unified animation configuration — mix spring and timing parameters freely.
 * When `duration` is provided the sheet uses `withTiming`; otherwise `withSpring`.
 */
export type AnimationConfig = SpringAnimationConfig & TimingAnimationConfig;

// ─────────────────────────────────────────────────────────────────────────────
// BottomSheet

export interface BottomSheetProps extends ViewProps {
  // ── Content ──────────────────────────────────────────────────────────────

  /** Content rendered inside the sheet. */
  children?: React.ReactNode;

  /**
   * Optional slot rendered below the handle, above the scrollable content area.
   * Height is measured automatically and subtracted from the content wrapper.
   * Ideal for a title, search field, or action bar.
   */
  headerComponent?: React.ReactNode;

  // ── Sizing ────────────────────────────────────────────────────────────────

  /**
   * Snap points as pixel values or percentage strings (e.g. `['40%', '70%', '95%']`).
   * Providing this array automatically disables `dynamicSizing`.
   */
  snapPoints?: SnapPoint[];

  /**
   * Auto-size the sheet to fit its content.
   * Enabled by default when `snapPoints` is omitted; ignored when `snapPoints` is present.
   */
  dynamicSizing?: boolean;

  /**
   * Maximum sheet height as pixels or a percentage string.
   * Acts as the hard top boundary — the sheet top never goes above
   * `screenHeight - maxHeight` regardless of keyboard or pan gestures.
   * Default: `'90%'`.
   */
  maxHeight?: SnapPoint;

  /**
   * Pre-calculated total sheet height (handle + header + content) in pixels.
   * Use this to avoid the layout-measurement round-trip in `dynamicSizing` mode,
   * for example when the content height is known in advance (e.g. picker lists).
   */
  contentHeight?: number;

  /** Index of the snap point to animate to on mount. Default: `0`. */
  initialSnapPointIndex?: number;

  // ── Backdrop ─────────────────────────────────────────────────────────────

  /** Render the dimmed backdrop behind the sheet. Default: `true`. */
  enableBackdrop?: boolean;

  /**
   * Maximum opacity of the backdrop when the sheet is fully open.
   * Range `0–1`. Default: `0.5`.
   */
  backdropOpacity?: number;

  // ── Gestures ─────────────────────────────────────────────────────────────

  /**
   * Allow the sheet to be closed by dragging the handle downward.
   * Content-area swipes never close the sheet regardless of this flag.
   * Default: `true`.
   */
  enablePanDownToClose?: boolean;

  /**
   * Enable the pan gesture on the handle bar.
   * Set to `false` to lock the sheet in place (can still be dismissed via API or backdrop).
   * Default: `true`.
   */
  enableHandlePanningGesture?: boolean;

  // ── Safe area ─────────────────────────────────────────────────────────────

  /**
   * Bottom safe-area inset in **density-independent pixels** (e.g. navigation
   * bar height on Android edge-to-edge, or `safeAreaInsets.bottom` on iOS).
   *
   * When provided, the content area is inset by this amount so that list items
   * are never hidden behind the system navigation bar. The sheet view itself
   * still extends to the physical screen bottom so no gap is visible.
   *
   * Obtain the value via `getBottomInset()` (Android) or
   * `useSafeAreaInsets().bottom` (iOS / cross-platform).
   *
   * Default: `0`.
   */
  bottomInset?: number;

  /**
   * Pass `true` while Android immersive mode (hidden navigation bar) is active.
   *
   * When enabled, the sheet uses `Dimensions.get('screen').height` (the physical
   * device height, always correct) instead of `useWindowDimensions().height`,
   * which may still report the pre-immersive window height until the native
   * `didUpdateDimensions` event arrives. This prevents the white gap / overflow
   * that can appear at the bottom of the screen right after the nav bar is hidden.
   *
   * Default: `false`.
   */
  isImmersive?: boolean;

  // ── Keyboard ─────────────────────────────────────────────────────────────

  /**
   * Automatically lift the sheet above the software keyboard.
   * The sheet bottom tracks the keyboard top; the sheet top stays fixed.
   * Default: `true`.
   */
  enableKeyboardAvoid?: boolean;

  // ── Animation ─────────────────────────────────────────────────────────────

  /**
   * Fine-tune the open/close animation.
   * Spring parameters (`damping`, `stiffness`, `mass`) and timing parameters
   * (`duration`, `easing`) can be mixed freely.
   */
  animationConfigs?: AnimationConfig;

  // ── Shared values (external control) ─────────────────────────────────────

  /**
   * Attach an external `SharedValue<number>` to mirror the sheet's
   * `translateY` position. Useful for driving parallel animations (e.g. a
   * custom backdrop or a sticky header outside the sheet).
   */
  animatedPosition?: SharedValue<number>;

  /**
   * Attach an external `SharedValue<number>` to mirror the current snap index.
   */
  animatedIndex?: SharedValue<number>;

  // ── Callbacks ─────────────────────────────────────────────────────────────

  /**
   * Fired when the sheet settles at a new snap point.
   * Receives the zero-based snap index.
   */
  onChange?: (snapIndex: number) => void;

  /**
   * Fired after the sheet has fully animated off-screen and been dismissed.
   */
  onClose?: () => void;

  // ── Style ─────────────────────────────────────────────────────────────────

  /**
   * Extra styles applied to the sheet container (`Animated.View`).
   * Use to override `backgroundColor`, `borderTopLeftRadius`, shadows, etc.
   */
  style?: StyleProp<ViewStyle>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Imperative API (ref)

export interface BottomSheetMethods {
  /**
   * Animate to a specific snap point by zero-based index.
   * In `dynamicSizing` mode the call is a no-op (always index 0).
   */
  snapToIndex: (index: number) => void;

  /**
   * Animate the sheet so its top edge is `position` pixels from the screen bottom.
   */
  snapToPosition: (position: number) => void;

  /** Expand to the largest snap point (or the dynamic height in `dynamicSizing` mode). */
  expand: () => void;

  /** Collapse to the smallest snap point (or the dynamic height in `dynamicSizing` mode). */
  collapse: () => void;

  /** Animate the sheet off-screen and fire `onClose`. */
  close: () => void;
}
