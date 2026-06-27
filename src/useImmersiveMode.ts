import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StatusBar, useWindowDimensions } from 'react-native';
import {
  getBottomInset,
  isImmersiveModeSupported,
  setImmersiveMode,
} from './ImmersiveMode';

// ── Module-level singleton ────────────────────────────────────────────────────
// Shared state lets every hook instance (and useImmersiveModeChange) stay in
// sync without a React Context or prop drilling.

let _isImmersive = false;
let _navBarHeight = 0;
let _navBarHeightReady = false;
const _subscribers = new Set<(value: boolean) => void>();

function _broadcast(value: boolean) {
  _subscribers.forEach((fn) => fn(value));
}

function _apply(enabled: boolean) {
  if (_isImmersive === enabled) return;
  _isImmersive = enabled;
  setImmersiveMode(enabled);
  _broadcast(enabled);
}

function _initNavBar(): Promise<number> {
  if (_navBarHeightReady) return Promise.resolve(_navBarHeight);
  return getBottomInset().then((h) => {
    _navBarHeight = h;
    _navBarHeightReady = true;
    return h;
  });
}

// ── useImmersiveMode ──────────────────────────────────────────────────────────

export interface UseImmersiveModeReturn {
  /** Whether the navigation bar is currently hidden. */
  isImmersive: boolean;

  /** Enable or disable immersive mode. All other hook instances update too. */
  setImmersive: (enabled: boolean) => void;

  /** Toggle the current immersive mode state. */
  toggle: () => void;

  /**
   * Top padding to apply to the root layout.
   * Non-zero when the window extends behind the status bar (immersive mode or
   * a device that defaults to edge-to-edge). Keeps content below the status bar.
   */
  topInset: number;

  /**
   * Bottom padding to forward to sheets / scroll views.
   * Non-zero only when edge-to-edge AND the nav bar is currently visible
   * (immersive OFF). Zero when the nav bar is hidden or outside the window.
   */
  bottomInset: number;

  /** True on Android when the ImmersiveMode native module is linked. */
  isSupported: boolean;
}

/**
 * Manages Android immersive mode (hidden navigation bar) and exposes the
 * derived layout insets so callers don't need to compute them separately.
 *
 * Multiple calls to this hook share a single global state — toggling immersive
 * in one component is instantly reflected in every other subscriber.
 *
 * Add `ImmersivePackage` to your app's `MainApplication.getPackages()` and
 * call `ImmersiveModule.reapplyIfNeeded(this)` from `MainActivity.onWindowFocusChanged`
 * to keep the mode sticky after dialogs or permission prompts.
 *
 * @example
 * ```tsx
 * const { isImmersive, setImmersive, topInset, bottomInset } = useImmersiveMode();
 *
 * return (
 *   <View style={{ flex: 1, paddingTop: topInset }}>
 *     <Switch value={isImmersive} onValueChange={setImmersive} />
 *   </View>
 * );
 * ```
 */
export function useImmersiveMode(): UseImmersiveModeReturn {
  const [isImmersive, _setLocal] = useState(_isImmersive);
  const [navBarHeight, setNavBarHeight] = useState(_navBarHeight);

  // Load the hardware nav-bar height once (shared across all hook instances).
  useEffect(() => {
    _initNavBar().then(setNavBarHeight);
  }, []);

  // Mirror global immersive changes into local React state so the component
  // re-renders whenever any instance calls setImmersive / toggle.
  useEffect(() => {
    const sub = (v: boolean) => _setLocal(v);
    _subscribers.add(sub);
    return () => {
      _subscribers.delete(sub);
    };
  }, []);

  const setImmersive = useCallback((enabled: boolean) => {
    _apply(enabled);
  }, []);

  const toggle = useCallback(() => {
    _apply(!_isImmersive);
  }, []);

  // ── Layout insets ─────────────────────────────────────────────────────────
  // isEdgeToEdge: the window fills the physical screen (nav bar overlays).
  // True both for immersive mode and for devices that default to edge-to-edge
  // (Android 15+ enforces it for all apps).
  const { height: windowH } = useWindowDimensions();
  const physScreenH = useMemo(() => Dimensions.get('screen').height, []);
  const isEdgeToEdge = windowH >= physScreenH - 5;

  // topInset — two triggers are needed:
  //   • isEdgeToEdge: device is always edge-to-edge (no immersive involved)
  //   • isImmersive:  immersive was just toggled; useWindowDimensions() may lag
  //                   because Display.getMetrics() doesn't always update in the
  //                   same JS frame as setDecorFitsSystemWindows(). The React
  //                   state is synchronous so it fires immediately.
  const topInset = (isEdgeToEdge || isImmersive)
    ? (StatusBar.currentHeight ?? 0)
    : 0;

  // bottomInset — only needed when the nav bar physically overlaps the content.
  const bottomInset = (isEdgeToEdge && !isImmersive) ? navBarHeight : 0;

  return {
    isImmersive,
    setImmersive,
    toggle,
    topInset,
    bottomInset,
    isSupported: isImmersiveModeSupported,
  };
}

// ── useImmersiveModeChange ────────────────────────────────────────────────────

/**
 * Fires `callback` whenever immersive mode is enabled or disabled by any
 * component (including other `useImmersiveMode` instances).
 *
 * The callback reference is always kept up-to-date internally, so you can
 * pass an inline function without adding it to a dependency array.
 *
 * @example
 * ```tsx
 * useImmersiveModeChange((enabled) => {
 *   Analytics.track('immersive_mode', { enabled });
 * });
 * ```
 */
export function useImmersiveModeChange(
  callback: (isImmersive: boolean) => void
): void {
  const ref = useRef(callback);
  // Keep the ref current on every render so stale closures are never an issue.
  useEffect(() => {
    ref.current = callback;
  });

  useEffect(() => {
    const sub = (v: boolean) => ref.current(v);
    _subscribers.add(sub);
    return () => {
      _subscribers.delete(sub);
    };
  }, []);
}
