import { useCallback, useEffect, useRef, useState } from 'react';
import { DeviceEventEmitter, Platform } from 'react-native';
import {
  getBottomInset,
  getTopInset,
  isImmersiveModeSupported,
  setImmersiveMode,
} from './ImmersiveMode';

// ── Module-level singleton ────────────────────────────────────────────────────

let _isImmersive = false;
let _topInset = 0;
let _bottomInset = 0;
/** Physical nav-bar height in dp — seeded once at launch, never cleared in immersive mode. */
let _navBarHeight = 0;
const _immersiveSubscribers = new Set<(value: boolean) => void>();
const _insetSubscribers = new Set<() => void>();
let _insetListenerRegistered = false;

function _broadcastImmersive(value: boolean) {
  _immersiveSubscribers.forEach((fn) => fn(value));
}

function _broadcastInsets() {
  _insetSubscribers.forEach((fn) => fn());
}

function _apply(enabled: boolean) {
  if (_isImmersive === enabled) return;
  _isImmersive = enabled;
  setImmersiveMode(enabled);
  _broadcastImmersive(enabled);
  if (enabled) {
    if (_bottomInset !== 0) {
      _bottomInset = 0;
      _broadcastInsets();
    }
    return;
  }
  getBottomInset().then((bottom) => {
    if (!_isImmersive && bottom !== _bottomInset) {
      _bottomInset = bottom;
      _broadcastInsets();
    }
  });
}

function _seedInsets(attempt = 0) {
  Promise.all([getTopInset(), getBottomInset()]).then(([top, bottom]) => {
    if (bottom > 0 && bottom !== _navBarHeight) {
      _navBarHeight = bottom;
      _broadcastInsets();
    }
    const nextBottom = _isImmersive ? 0 : bottom;
    const needsBottom = !_isImmersive && nextBottom === 0;
    const shouldRetry = attempt < 8 && (top === 0 || needsBottom);

    if (shouldRetry) {
      setTimeout(() => _seedInsets(attempt + 1), 50 * (attempt + 1));
      return;
    }

    if (top !== _topInset || nextBottom !== _bottomInset) {
      _topInset = top;
      _bottomInset = nextBottom;
      _broadcastInsets();
    }
  });
}

function _ensureInsetListener() {
  if (_insetListenerRegistered || Platform.OS !== 'android') return;
  _insetListenerRegistered = true;

  // Seed values before InsetScreen mounts and emits the first event.
  _seedInsets();

  DeviceEventEmitter.addListener(
    'screenInsetsChanged',
    (event: { top?: number; bottom?: number }) => {
      const top = event.top ?? 0;
      const bottom = event.bottom ?? 0;
      // InsetScreenView always measures correctly via getInsets() (no throw).
      // Cache the non-zero bottom as the physical nav-bar height so it stays
      // available while in immersive mode (where bottom is reported as 0).
      if (bottom > 0) {
        _navBarHeight = bottom;
      }
      if (top === _topInset && bottom === _bottomInset) return;
      _topInset = top;
      _bottomInset = bottom;
      _broadcastInsets();
    }
  );
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
   * Top inset in dp — measured natively by [InsetScreen] from visible
   * status-bar / cutout insets. Zero until an [InsetScreen] mounts.
   */
  topInset: number;

  /**
   * Bottom inset in dp — measured natively by [InsetScreen] from the
   * currently visible navigation bar. Updates automatically when immersive
   * mode or the keyboard toolbar toggles the nav bar.
   */
  bottomInset: number;

  /**
   * Physical navigation-bar height in dp (hardware), measured once at launch.
   * Stays non-zero in immersive mode — use for scroll padding when the keyboard
   * is open and the nav bar is hidden.
   */
  navBarHeight: number;

  /** True on Android when the ImmersiveMode native module is linked. */
  isSupported: boolean;
}

/** Cached physical nav-bar height in dp (see {@link UseImmersiveModeReturn.navBarHeight}). */
export function getNavBarHeight(): number {
  return _navBarHeight;
}

/**
 * Manages Android immersive mode and exposes native screen insets.
 *
 * Mount an {@link InsetScreen} wrapper around your root content — Kotlin
 * computes top/bottom padding via `WindowInsetsCompat` and broadcasts
 * values through `screenInsetsChanged`.
 *
 * @example
 * ```tsx
 * const { isImmersive, setImmersive, bottomInset } = useImmersiveMode();
 *
 * return (
 *   <>
 *     <InsetScreen style={{ flex: 1 }}>
 *       <Switch value={isImmersive} onValueChange={setImmersive} />
 *     </InsetScreen>
 *     <BottomSheet bottomInset={bottomInset} isImmersive={isImmersive} />
 *   </>
 * );
 * ```
 */
export function useImmersiveMode(): UseImmersiveModeReturn {
  const [isImmersive, setLocalImmersive] = useState(_isImmersive);
  const [topInset, setTopInset] = useState(_topInset);
  const [bottomInset, setBottomInset] = useState(_bottomInset);
  const [navBarHeight, setNavBarHeight] = useState(_navBarHeight);

  useEffect(() => {
    _ensureInsetListener();
    const immersiveSub = (v: boolean) => setLocalImmersive(v);
    const insetSub = () => {
      setTopInset(_topInset);
      setBottomInset(_bottomInset);
      setNavBarHeight(_navBarHeight);
    };
    _immersiveSubscribers.add(immersiveSub);
    _insetSubscribers.add(insetSub);
    return () => {
      _immersiveSubscribers.delete(immersiveSub);
      _insetSubscribers.delete(insetSub);
    };
  }, []);

  const setImmersive = useCallback((enabled: boolean) => {
    _apply(enabled);
  }, []);

  const toggle = useCallback(() => {
    _apply(!_isImmersive);
  }, []);

  return {
    isImmersive,
    setImmersive,
    toggle,
    topInset,
    bottomInset,
    navBarHeight,
    isSupported: isImmersiveModeSupported,
  };
}

// ── useImmersiveModeChange ────────────────────────────────────────────────────

/**
 * Fires `callback` whenever immersive mode is enabled or disabled by any
 * component (including other `useImmersiveMode` instances).
 */
export function useImmersiveModeChange(
  callback: (isImmersive: boolean) => void
): void {
  const ref = useRef(callback);
  useEffect(() => {
    ref.current = callback;
  });

  useEffect(() => {
    const sub = (v: boolean) => ref.current(v);
    _immersiveSubscribers.add(sub);
    return () => {
      _immersiveSubscribers.delete(sub);
    };
  }, []);
}
