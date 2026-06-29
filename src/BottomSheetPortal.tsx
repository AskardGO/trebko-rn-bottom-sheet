import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

// ── Context ───────────────────────────────────────────────────────────────────

export interface SheetContextValue {
  /**
   * Open a sheet at the Portal level (full-screen, above all content).
   *
   * @param render - A function that receives a `close` callback and returns
   *   any React node. Typically a `BottomSheet`, `BottomSheetPicker`, etc.
   *
   * @example
   * ```tsx
   * open((close) => (
   *   <BottomSheetPicker
   *     items={cities}
   *     onSelect={(city) => { setCity(city); close(); }}
   *     onClose={close}
   *   />
   * ));
   * ```
   */
  open: (render: (close: () => void) => React.ReactNode) => void;

  /** Programmatically close the currently open sheet. */
  close: () => void;
}

const SheetContext = createContext<SheetContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export interface BottomSheetPortalProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Portal provider that renders sheets at the top of the component hierarchy,
 * ensuring they are always positioned relative to the full screen — not to
 * the container where `useSheet().open()` is called.
 *
 * Place it **once** as a direct child of `GestureHandlerRootView`, wrapping
 * your entire navigation tree. Then call `useSheet().open()` from any
 * component, no matter how deeply nested.
 *
 * @example
 * ```tsx
 * // Root of your app (index.tsx / App.tsx)
 * <GestureHandlerRootView style={{ flex: 1 }}>
 *   <BottomSheetPortal>
 *     <InsetScreen style={{ flex: 1 }}>
 *       <YourNavigation />
 *     </InsetScreen>
 *   </BottomSheetPortal>
 * </GestureHandlerRootView>
 * ```
 *
 * @example
 * ```tsx
 * // Any component deep in the tree
 * const { open } = useSheet();
 *
 * <TouchableOpacity
 *   onPress={() =>
 *     open((close) => (
 *       <BottomSheetPicker
 *         items={cities}
 *         onSelect={(city) => { setCity(city); close(); }}
 *         onClose={close}
 *       />
 *     ))
 *   }
 * >
 *   <Text>Select city</Text>
 * </TouchableOpacity>
 * ```
 */
export function BottomSheetPortal({ children, style }: BottomSheetPortalProps) {
  const [sheet, setSheet] = useState<React.ReactNode>(null);

  const close = useCallback(() => setSheet(null), []);

  const open = useCallback(
    (render: (close: () => void) => React.ReactNode) => {
      setSheet(render(close));
    },
    [close]
  );

  const ctx = useMemo<SheetContextValue>(() => ({ open, close }), [open, close]);

  return (
    <SheetContext.Provider value={ctx}>
      {/*
       * The View fills its parent (GestureHandlerRootView).
       * Because BottomSheet uses StyleSheet.absoluteFill, it positions itself
       * relative to the nearest positioned ancestor — this View.
       * As long as this View covers the full screen, the sheet does too.
       */}
      <View style={[styles.root, style]}>
        {children}
        {sheet}
      </View>
    </SheetContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns `open` and `close` functions for the nearest `BottomSheetPortal`.
 * Must be used inside a `<BottomSheetPortal>` tree.
 *
 * @example
 * ```tsx
 * const { open, close } = useSheet();
 * ```
 */
export function useSheet(): SheetContextValue {
  const ctx = useContext(SheetContext);
  if (!ctx) {
    throw new Error(
      'useSheet() was called outside of a <BottomSheetPortal>. ' +
        'Wrap your root component with <BottomSheetPortal>.'
    );
  }
  return ctx;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
});
