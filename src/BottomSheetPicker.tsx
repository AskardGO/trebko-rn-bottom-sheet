import React, { useCallback, useMemo, useRef, useState } from 'react';
import type {
  FlatListProps,
  StyleProp,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from 'react-native';
import type { ScrollIndicatorProps } from './ScrollIndicator';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { BottomSheet } from './BottomSheet';
import { BottomSheetFlatList } from './BottomSheetFlatList';
import { useImmersiveMode } from './useImmersiveMode';
import type { BottomSheetMethods, BottomSheetProps } from './types';
import { resolveSize } from './utils';

// Must match BottomSheet.tsx constants
const DEFAULT_ITEM_HEIGHT = 52;
const HANDLE_AREA = 32;
const CHROME_PADDING = 16;
const TITLE_HEIGHT = 36;   // title text + marginBottom
const SEARCH_HEIGHT = 60;  // TextInput(44) + marginBottom(8) + gap(8)

// ─────────────────────────────────────────────────────────────────────────────
// Public types

/**
 * Info passed to the `renderItem` callback.
 * In single-select mode `onSelect` triggers selection and closes the sheet.
 * In multi-select mode `onSelect` toggles the item and keeps the sheet open.
 */
export interface PickerRenderItemInfo<TItem> {
  item: TItem;
  /** Index within the currently filtered list. */
  index: number;
  /** True when this item is currently selected / part of the active selection. */
  isSelected: boolean;
  /**
   * Call to select (single) or toggle (multi) this item.
   * The sheet closes automatically only in single-select mode.
   */
  onSelect: () => void;
}

export interface BottomSheetPickerProps<TItem = string>
  extends Omit<BottomSheetProps, 'snapPoints' | 'dynamicSizing' | 'children'> {
  // ── Data ──────────────────────────────────────────────────────────────────
  items: TItem[];

  // ── Single-select ─────────────────────────────────────────────────────────
  /**
   * Currently selected item.
   * Controls `isSelected` in `renderItem` when `multiple` is false.
   */
  value?: TItem;
  /** Fired when the user taps an item. Sheet closes automatically. */
  onSelect?: (item: TItem, index: number) => void;

  // ── Multi-select ──────────────────────────────────────────────────────────
  /**
   * Enable multi-select mode.
   * Items toggle on tap; the sheet stays open until the user taps "Done"
   * or dismisses it with a swipe / backdrop tap.
   * Default: `false`.
   */
  multiple?: boolean;
  /**
   * Currently selected items (controlled, multi-select mode).
   * Pass an empty array `[]` to start with nothing selected.
   */
  values?: TItem[];
  /**
   * Fired on every item toggle (multi-select mode).
   * Receives the full updated selection array.
   */
  onValuesChange?: (items: TItem[]) => void;
  /**
   * Fired when the user taps the "Done" button (multi-select mode).
   * The sheet closes automatically after this callback.
   * Receives the current selection at the time of confirmation.
   */
  onApply?: (items: TItem[]) => void;
  /**
   * Label for the "Done" button shown in multi-select mode.
   * Default: `'Done'`.
   */
  applyButtonLabel?: string;
  /** Extra styles for the "Done" button container. */
  applyButtonStyle?: StyleProp<ViewStyle>;
  /** Extra styles for the "Done" button label. */
  applyButtonTextStyle?: StyleProp<TextStyle>;

  // ── Search ────────────────────────────────────────────────────────────────
  enableSearch?: boolean;
  searchPlaceholder?: string;
  /** Extra props forwarded verbatim to the internal TextInput. */
  searchInputProps?: Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder'>;

  // ── Header ────────────────────────────────────────────────────────────────
  title?: string;

  // ── Custom render ─────────────────────────────────────────────────────────
  /**
   * Fully replace the default row render.
   * Receives `{ item, index, isSelected, onSelect }`.
   */
  renderItem?: (info: PickerRenderItemInfo<TItem>) => React.ReactNode;

  /**
   * Extract a unique string key from an item (used by FlatList).
   * Defaults to `String(item) + '-' + index`.
   */
  keyExtractor?: (item: TItem, index: number) => string;

  /**
   * Convert an item to the label shown in the default row and used for search.
   * Also used as item identity for multi-select comparison.
   * Defaults to `String(item)`.
   */
  getItemLabel?: (item: TItem) => string;

  /**
   * Height of a single row — used for pre-calculating sheet height.
   * Only relevant when using the default row render.
   * Defaults to 52.
   */
  itemHeight?: number;

  // ── List passthrough ──────────────────────────────────────────────────────
  /**
   * Any FlatList props forwarded verbatim to the internal BottomSheetFlatList.
   * `data`, `renderItem` and `keyExtractor` are controlled by the picker.
   */
  flatListProps?: Omit<
    FlatListProps<TItem>,
    'data' | 'renderItem' | 'keyExtractor'
  >;

  /** Replaces the built-in "No results" component. */
  listEmptyComponent?: React.ReactNode;

  // ── Scroll indicator ───────────────────────────────────────────────────────
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

  // ── Selected indicator ────────────────────────────────────────────────────
  /**
   * Replace the default selection dot with any React node.
   * Rendered at the trailing edge of the row when `isSelected` is true.
   * Pass `null` to hide the indicator entirely.
   */
  selectedIndicatorComponent?: React.ReactNode;

  // ── Style overrides ───────────────────────────────────────────────────────
  titleStyle?: StyleProp<TextStyle>;
  itemStyle?: StyleProp<ViewStyle>;
  itemPressedStyle?: StyleProp<ViewStyle>;
  itemTextStyle?: StyleProp<TextStyle>;
  searchInputStyle?: StyleProp<TextStyle>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component

export function BottomSheetPicker<TItem = string>({
  items,
  // single
  value,
  onSelect,
  // multi
  multiple = false,
  values,
  onValuesChange,
  onApply,
  applyButtonLabel = 'Done',
  applyButtonStyle,
  applyButtonTextStyle,
  // search
  enableSearch = false,
  searchPlaceholder = 'Search...',
  searchInputProps,
  // header
  title,
  // render
  renderItem: renderItemProp,
  keyExtractor: keyExtractorProp,
  getItemLabel,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  // list
  flatListProps,
  listEmptyComponent,
  // scroll indicator
  showsCustomScrollIndicator = true,
  scrollIndicatorProps,
  // selected indicator
  selectedIndicatorComponent,
  // styles
  titleStyle,
  itemStyle,
  itemPressedStyle,
  itemTextStyle,
  searchInputStyle,
  // sheet
  maxHeight = '90%',
  headerComponent,
  onClose,
  ...sheetProps
}: BottomSheetPickerProps<TItem>) {
  const { height: screenHeight } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const searchRef = useRef<TextInput>(null);
  const sheetRef = useRef<BottomSheetMethods>(null);

  // Read immersive state from the module-level hook; explicit sheetProps take precedence.
  const { isImmersive: hookIsImmersive, bottomInset: hookBottomInset } = useImmersiveMode();
  const isImmersive: boolean = (sheetProps as { isImmersive?: boolean }).isImmersive ?? hookIsImmersive;

  // Mirror BottomSheet's effectiveScreenH logic: when immersive is active the
  // nav bar is hidden and physScreenH is the reliable source of truth.
  const physScreenH = useMemo(() => Dimensions.get('screen').height, []);
  const effectiveScreenH = isImmersive ? physScreenH : screenHeight;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getLabel = useMemo(
    () => (item: TItem): string =>
      getItemLabel ? getItemLabel(item) : String(item),
    [getItemLabel]
  );

  const extractKey = useMemo(
    () => (item: TItem, index: number): string =>
      keyExtractorProp ? keyExtractorProp(item, index) : `${String(item)}-${index}`,
    [keyExtractorProp]
  );

  // ── Selection helpers ─────────────────────────────────────────────────────
  // Item identity is determined by label (or keyExtractor result without index).
  // For object items, consumers should provide getItemLabel or keyExtractor.
  const isItemSelected = useCallback(
    (item: TItem): boolean => {
      if (multiple) {
        const label = getLabel(item);
        return (values ?? []).some((v) => getLabel(v) === label);
      }
      return value !== undefined && item === value;
    },
    [multiple, values, value, getLabel]
  );

  const handleToggle = useCallback(
    (item: TItem, filteredIndex: number) => {
      if (!multiple) {
        // Resolve the index against the original (unfiltered) items array so that
        // consumers always receive a stable, search-independent position.
        const originalIndex = items.findIndex((i) => getLabel(i) === getLabel(item));
        onSelect?.(item, originalIndex !== -1 ? originalIndex : filteredIndex);
        return;
      }
      const label = getLabel(item);
      const current = values ?? [];
      const alreadySelected = current.some((v) => getLabel(v) === label);
      const next = alreadySelected
        ? current.filter((v) => getLabel(v) !== label)
        : [...current, item];
      onValuesChange?.(next);
      // In multi mode the sheet stays open — no close here
    },
    [multiple, items, values, onSelect, onValuesChange, getLabel]
  );

  const handleApply = useCallback(() => {
    onApply?.(values ?? []);
    sheetRef.current?.close();
  }, [onApply, values]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => getLabel(item).toLowerCase().includes(q));
  }, [items, query, getLabel]);

  // ── Height pre-calculation ─────────────────────────────────────────────────
  const maxHeightPx = useMemo(
    () => resolveSize(maxHeight, effectiveScreenH, effectiveScreenH * 0.9),
    [maxHeight, effectiveScreenH]
  );

  // bottomInset for overhead calculation: explicit sheetProp overrides hook value.
  const bottomInset: number = (sheetProps as { bottomInset?: number }).bottomInset ?? hookBottomInset;

  // Mirror the library's own effectiveBottomInset logic:
  // only apply the inset when the window is in edge-to-edge mode.
  const effectiveBottomInset = effectiveScreenH >= physScreenH - 5 ? bottomInset : 0;

  // Overhead: handle + chrome + effective nav bar inset + any header content above the list
  const overhead =
    HANDLE_AREA +
    CHROME_PADDING +
    effectiveBottomInset +
    (title ? TITLE_HEIGHT : 0) +
    (enableSearch ? SEARCH_HEIGHT : 0);

  const footerHeight = 0;

  const listHeight = Math.min(
    Math.max(filteredItems.length * itemHeight + overhead + footerHeight, 160),
    maxHeightPx
  );
  const needsScroll = filteredItems.length * itemHeight + overhead + footerHeight > maxHeightPx;

  // Right offset for the selected dot: keeps it clear of the scroll indicator.
  const dotRightOffset =
    showsCustomScrollIndicator
      ? (scrollIndicatorProps?.width ?? 3) +
        (scrollIndicatorProps?.insetRight ?? 2) +
        4
      : 4;

  // ── Default row ────────────────────────────────────────────────────────────
  const defaultRenderItem = ({
    item,
    index,
  }: {
    item: TItem;
    index: number;
  }) => {
    const isSelected = isItemSelected(item);
    const handlePress = () => handleToggle(item, index);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.item,
          itemStyle,
          (pressed || isSelected) && styles.itemHighlight,
          (pressed || isSelected) && itemPressedStyle,
        ]}
        onPress={handlePress}
      >
        <Text
          style={[styles.itemText, itemTextStyle, isSelected && styles.itemTextSelected]}
        >
          {getLabel(item)}
        </Text>
        {isSelected && (
          selectedIndicatorComponent !== undefined ? (
            <View style={{ marginRight: dotRightOffset }}>
              {selectedIndicatorComponent}
            </View>
          ) : (
            <View style={[styles.selectedDot, { marginRight: dotRightOffset }]} />
          )
        )}
      </Pressable>
    );
  };

  // ── Custom row wrapper (provides PickerRenderItemInfo) ─────────────────────
  const renderRow = ({ item, index }: { item: TItem; index: number }) => {
    if (!renderItemProp) return defaultRenderItem({ item, index });
    const isSelected = isItemSelected(item);
    return (
      <>
        {renderItemProp({
          item,
          index,
          isSelected,
          onSelect: () => handleToggle(item, index),
        })}
      </>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <BottomSheet
      ref={sheetRef}
      dynamicSizing
      maxHeight={maxHeight}
      contentHeight={listHeight}
      headerComponent={
        <>
          {title ? (
            <Text style={[styles.title, titleStyle]}>{title}</Text>
          ) : null}
          {enableSearch ? (
            <TextInput
              ref={searchRef}
              style={[styles.searchInput, searchInputStyle]}
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor="#9CA3AF"
              autoCorrect={false}
              clearButtonMode="while-editing"
              {...searchInputProps}
            />
          ) : null}
          {headerComponent}
        </>
      }
      onClose={() => {
        setQuery('');
        onClose?.();
      }}
      {...sheetProps}
    >
      <BottomSheetFlatList
        data={filteredItems as any[]}
        keyExtractor={(item: any, index: number) => extractKey(item as TItem, index)}
        renderItem={({ item, index }: { item: any; index: number }) =>
          renderRow({ item: item as TItem, index })
        }
        nestedScrollEnabled
        scrollEnabled={needsScroll}
        showsCustomScrollIndicator={showsCustomScrollIndicator}
        scrollIndicatorProps={scrollIndicatorProps}
        ListEmptyComponent={
          listEmptyComponent !== undefined ? (
            <>{listEmptyComponent}</>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No results</Text>
            </View>
          )
        }
        {...(flatListProps as any)}
      />
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  item: {
    height: DEFAULT_ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  itemHighlight: {
    backgroundColor: '#EEF2FF',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    paddingHorizontal: 16,
  },
  itemTextSelected: {
    color: '#4338CA',
    fontWeight: '600',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4338CA',
    flexShrink: 0,
  },
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#9CA3AF',
  },
});
