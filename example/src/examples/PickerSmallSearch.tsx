/**
 * PickerSmallSearch — demonstrates BottomSheetPicker with 2 items and
 * a built-in search bar (enableSearch). The list filters as you type.
 *
 * Usage:
 *   <PickerSmallSearchSheet
 *     value={city}
 *     onSelect={(city) => setCity(city)}
 *     onClose={() => setOpen(false)}
 *   />
 */
import React from 'react';
import { BottomSheetPicker } from '@trebko/rn-bottom-sheet';
import { CITIES_2 } from '../shared/data/cities';
import { SHEET_STYLE } from '../shared/utils/sheetStyle';

// ─── Demo catalogue entry ────────────────────────────────────────────────────

export const PICKER_SMALL_SEARCH_DEMO = {
  title: 'Picker · 2 items + search',
  subtitle: 'Dynamic sizing · filterable list',
};

// ─── Sheet component ─────────────────────────────────────────────────────────

interface Props {
  value?: string;
  onSelect: (item: string) => void;
  onClose: () => void;
}

export function PickerSmallSearchSheet({ value, onSelect, onClose }: Props) {
  return (
    <BottomSheetPicker
      title="Select city"
      items={[...CITIES_2]}
      value={value}
      enableSearch
      searchPlaceholder="Search cities..."
      onSelect={onSelect}
      onClose={onClose}
      style={SHEET_STYLE}
    />
  );
}
