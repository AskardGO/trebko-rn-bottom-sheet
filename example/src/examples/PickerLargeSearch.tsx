/**
 * PickerLargeSearch — demonstrates BottomSheetPicker with 20 items,
 * a search bar, and a custom row renderer.
 *
 * Usage:
 *   <PickerLargeSearchSheet
 *     value={city}
 *     onSelect={(city) => setCity(city)}
 *     onClose={() => setOpen(false)}
 *   />
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetPicker } from '@trebko/rn-bottom-sheet';
import type { PickerRenderItemInfo } from '@trebko/rn-bottom-sheet';
import { CITIES_20 } from '../shared/data/cities';
import { SHEET_STYLE } from '../shared/utils/sheetStyle';

// ─── Demo catalogue entry ────────────────────────────────────────────────────

export const PICKER_LARGE_SEARCH_DEMO = {
  title: 'Picker · 20 items + search',
  subtitle: 'Dynamic sizing · filterable · custom row',
};

// ─── Custom row renderer ─────────────────────────────────────────────────────

function CityRow({ item, isSelected, onSelect }: PickerRenderItemInfo<string>) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        row.container,
        pressed && row.pressed,
        isSelected && row.selected,
      ]}
    >
      <Text style={[row.label, item === 'Kharkiv' && row.bold]}>{item}</Text>
      {isSelected && <View style={row.dot} />}
    </Pressable>
  );
}

const row = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: 16 },
  pressed: { backgroundColor: '#F5F5F5' },
  selected: { backgroundColor: '#EEF2FF' },
  label: { flex: 1, fontSize: 16, color: '#111827' },
  bold: { fontWeight: '700' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1', marginRight: 8 },
});

// ─── Sheet component ─────────────────────────────────────────────────────────

interface Props {
  value?: string;
  onSelect: (item: string) => void;
  onClose: () => void;
}

export function PickerLargeSearchSheet({ value, onSelect, onClose }: Props) {
  return (
    <BottomSheetPicker
      title="Select city"
      items={[...CITIES_20]}
      value={value}
      enableSearch
      searchPlaceholder="Search cities..."
      renderItem={CityRow}
      onSelect={onSelect}
      onClose={onClose}
      style={SHEET_STYLE}
    />
  );
}
